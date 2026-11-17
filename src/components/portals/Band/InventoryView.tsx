import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  MoreVertical, 
  Maximize2, 
  CheckSquare, 
  Search, 
  Grid, 
  List, 
  SlidersHorizontal, 
  Plus, 
  ChevronLeft, 
  TrendingUp, 
  AlertTriangle,
  AlertCircle,
  Star,
  Minus,
  Printer,
  Mail,
  Phone,
  Settings,
  Trash2,
  ExternalLink,
  MapPin,
  ThumbsUp,
  Heart,
  MessageSquare,
  Ban,
  Disc,
  Music,
  Download,
  Upload,
  RefreshCw,
  Lock,
  Link2,
  Unlink,
  Database,
  Check,
  ShoppingBag
} from 'lucide-react';
import { InventoryItem, InventoryAudit, StagedDistroItem } from '../../../types';
import { getSupabase, sanitizeInventoryItemForDb, executeWithSchemaResilience, generateUUID, resolveInventoryImageUrl } from '../../../supabase';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  inventoryAudits?: InventoryAudit[];
  setInventoryAudits?: React.Dispatch<React.SetStateAction<InventoryAudit[]>>;
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  activeBandId?: string;
  onAddNew?: () => void;
  onEditItem?: (item: InventoryItem) => void;
  onOpenTransferModal?: (itemId?: string) => void;
  onNavigateToPrinters?: () => void;
  onGoToPublicStore?: () => void;
  stagedDistroItems: StagedDistroItem[];
  setStagedDistroItems: React.Dispatch<React.SetStateAction<StagedDistroItem[]>>;
  activeClearanceLevel?: number;
}

export default function InventoryView({
  inventory,
  setInventory,
  inventoryAudits = [],
  setInventoryAudits,
  onBack,
  triggerNotification,
  addLog,
  activeBandId,
  onAddNew,
  onEditItem,
  onOpenTransferModal,
  onNavigateToPrinters,
  onGoToPublicStore,
  stagedDistroItems = [],
  setStagedDistroItems,
  activeClearanceLevel = 5
}: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'audit'>('grid');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('name-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Healthy' | 'Warning' | 'Critical'>('all');

  const handleCopyToMerchShop = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const exists = (stagedDistroItems || []).some((i: any) => i.inventory_id === item.id);
      if (exists) {
        triggerNotification(`⚠️ "${item?.name}" is already in the Public Merch storefront!`);
        return;
      }

      const newItem: StagedDistroItem = {
        id: `distro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        inventory_id: item.id,
        name: item?.name,
        original_item_type: item.item_type || 'Merch',
        storefront_price: item.price || 35.00,
        public_description: `Official tour merch variant: ${item?.name}. Premium tailored grade. Available for public order now!`,
        product_image_url: resolveInventoryImageUrl(item),
        image_path: item.image_path || undefined,
        visibility_status: true
      };

      const updated = [newItem, ...stagedDistroItems];
      setStagedDistroItems(updated);
      triggerNotification(`🚀 Successfully copy-synced "${item?.name}" to the Public Merch Shop!`);
      if (addLog) addLog(`User copy-synced physical inventory node ${item.id} to public distro storefront.`);
    } catch (err) {
      console.warn("Local storage check or parsing failed:", err);
    }
  };

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
        specialties: ['Tees', 'Hoodies', 'Embroidery'],
        likes: 89,
        liked_by_user: false,
        reviews: [
          { name: 'Dave G. (Bassist)', rating: 5, text: 'The best screenprinting for our US tour. Extremely fast turnaround.', date: '2026-05-15' },
          { name: 'Sarah L. (Tour Mgr)', rating: 4.8, text: 'Custom embroidery looks pristine, t-shirts are heavy-weight and durable.', date: '2026-04-20' }
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
        specialties: ['CD/Vinyl', 'Patches', 'Stickers'],
        likes: 54,
        liked_by_user: false,
        reviews: [
          { name: 'Marcus K. (Guitar)', rating: 5, text: 'Vinyl pressing arrived right in time for the London headliner show. Exceptional! Def recommended.', date: '2026-05-10' }
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
        specialties: ['Tees', 'Wall Flags', 'Tour Bundles'],
        likes: 67,
        liked_by_user: false,
        reviews: [
          { name: 'Jimmy T.', rating: 5, text: 'Best budget bundles for screenprints. Very easy to work with!', date: '2026-03-12' }
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
        specialties: ['Stickers', 'Patches'],
        likes: 104,
        liked_by_user: false,
        reviews: [
          { name: 'Renee S.', rating: 5, text: 'Holographic stickers sold out in two nights! Top quality material.', date: '2026-05-02' }
        ]
      }
    ];
  });

  // Hybrid Cloud Synchronizer for Network-Wide Community Printer pool
  const [printersSyncStatus, setPrintersSyncStatus] = useState<'connecting' | 'connected' | 'local_resilience'>('connecting');

  // Network uploader supporting retrofitted standard schemas or dynamic environments
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
      likes: p.likes || 0,
      reviews: p.reviews || [],
      blacklisted: !!p.blacklisted,
      blacklist_reason: p.blacklist_reason || null
    };

    try {
      // Use executeWithSchemaResilience to dynamically strip any custom fields not present on target cloud schema
      await executeWithSchemaResilience(async (payload) => {
        return await supabase.from('community_printers_v1').upsert([payload]);
      }, dbPayload);
    } catch (err) {
      console.info('[Community Database] Failed to write printer to cloud. Network fallback active.', err);
    }
  };

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
            console.info('[Community Database] community_printers_v1 table not found in Supabase. Falling back to robust local resilience storage.');
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

  useEffect(() => {
    try {
      localStorage.setItem('nexus_core_printers', JSON.stringify(printers));
    } catch (_) {}
  }, [printers]);

  const [isPrintersModalOpen, setIsPrintersModalOpen] = useState(false);
  const [showAddPrinterForm, setShowAddPrinterForm] = useState(false);
  
  // Community interactive states
  const [printerSearchQuery, setPrinterSearchQuery] = useState('');
  const [printerSpecialtyFilter, setPrinterSpecialtyFilter] = useState('All');
  const [printerPriceFilter, setPrinterPriceFilter] = useState('All');
  const [printerSortBy, setPrinterSortBy] = useState('rating');
  const [expandedPrinterId, setExpandedPrinterId] = useState<string | null>(null);
  const [newReviewForm, setNewReviewForm] = useState({
    name: '',
    rating: 5,
    text: ''
  });

  // Blacklist database management
  const [printerViewMode, setPrinterViewMode] = useState<'active' | 'blacklisted' | 'all'>('active');
  const [blacklistingId, setBlacklistingId] = useState<string | null>(null);
  const [blacklistNotes, setBlacklistNotes] = useState('');

  const [newPrinter, setNewPrinter] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    notes: '',
    rating: '4.8',
    price_range: 'moderate',
    region: 'Austin, TX',
    specialties: 'Tees, Hoodies, Screenprint'
  });

  // Reorder process details
  const [reorderItem, setReorderItem] = useState<any>(null);
  const [selectedPrinterForReorder, setSelectedPrinterForReorder] = useState<any>(null);
  const [reorderQuantity, setReorderQuantity] = useState<number>(100);
  const [reorderDraftNotes, setReorderDraftNotes] = useState<string>('');

  const isLow10Percent = (item: any) => {
    const total = (item.table_stock || 0) + (item.van_stock || 0);
    const limit = Math.ceil(0.1 * (item.initial_batch_size || 100));
    return total <= limit;
  };

  const handleTriggerReorder = (item: any) => {
    setReorderItem(item);
    setReorderQuantity(item.initial_batch_size || 100);
    setReorderDraftNotes(`Hi! We are running low on the "${item?.name}" standard apparel item. We currently only have ${(item.table_stock || 0) + (item.van_stock || 0)} units left. We want to place an urgent order of ${item.initial_batch_size || 100} units. Let us know the estimate. Cheers!`);
    if (printers.length > 0) {
      setSelectedPrinterForReorder(printers[0]);
    } else {
      setSelectedPrinterForReorder(null);
    }
  };

  const handleAddPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrinter.name) {
      triggerNotification('Printer name is required.');
      return;
    }
    const createdPrinter = {
      id: 'printer_' + Date.now(),
      name: newPrinter.name,
      company_name: newPrinter.company_name || 'Production Corp',
      email: newPrinter.email || 'orders@example.com',
      phone: newPrinter.phone || '',
      notes: newPrinter.notes || '',
      rating: parseFloat(newPrinter.rating) || 4.5,
      price_range: newPrinter.price_range || 'moderate',
      region: newPrinter.region || 'Unknown Location',
      specialties: newPrinter.specialties ? newPrinter.specialties.split(',').map(s => s.trim()).filter(Boolean) : ['Screenprint'],
      likes: 1,
      liked_by_user: false,
      reviews: []
    };
    setPrinters(prev => [...prev, createdPrinter]);
    uploadPrinterToCloud(createdPrinter);
    setNewPrinter({ 
      name: '', 
      company_name: '', 
      email: '', 
      phone: '', 
      notes: '',
      rating: '4.8',
      price_range: 'moderate',
      region: 'Austin, TX',
      specialties: 'Tees, Hoodies, Screenprint'
    });
    setShowAddPrinterForm(false);
    triggerNotification('New community-driven merchandise printer registered successfully!');
    addLog(`Registered custom production printer: "${createdPrinter.company_name}" (${createdPrinter.name})`);
  };

  const handleDeletePrinter = async (printerId: string) => {
    setPrinters(prev => prev.filter(p => p.id !== printerId));
    triggerNotification('Printer contact removed from database.');
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('community_printers_v1').delete().eq('id', printerId);
      } catch (_) {}
    }
  };
  // Bandcamp Integration Hub States
  const [showBandcampPanel, setShowBandcampPanel] = useState(false);
  const [bcConnected, setBcConnected] = useState(() => {
    return localStorage.getItem('nexus_core_bc_connected') === 'true';
  });
  const [bcAccountType, setBcAccountType] = useState(() => {
    return localStorage.getItem('nexus_core_bc_acct_type') || 'sandbox';
  });
  const [bcClientId, setBcClientId] = useState(() => {
    return localStorage.getItem('nexus_core_bc_client_id') || '';
  });
  const [bcClientSecret, setBcClientSecret] = useState(() => {
    return localStorage.getItem('nexus_core_bc_client_secret') || '';
  });
  const [bcBandId, setBcBandId] = useState(() => {
    return localStorage.getItem('nexus_core_bc_band_id') || '';
  });
  const [isConnectingBc, setIsConnectingBc] = useState(false);
  const [isSyncingBc, setIsSyncingBc] = useState(false);
  const [isImportingBc, setIsImportingBc] = useState(false);

  // Bandcamp mock catalogue items that can be imported to the core inventory
  const [bcCatalog, setBcCatalog] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexus_core_bc_catalog');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      { id: 'bc-1', name: 'Acts of Sadistic Cruelty LP', stock: 80, price: 25, item_type: 'Vinyl', border_color: '#a855f7', imported: false, sku: 'BC-SAD-LP' },
      { id: 'bc-2', name: 'Relic of Desolation Cassette', stock: 40, price: 10, item_type: 'Audio Cassette', border_color: '#10b981', imported: false, sku: 'BC-REL-CAS' },
      { id: 'bc-3', name: 'Morbid Inverted Logo Tee', stock: 45, price: 20, item_type: 'One Size', border_color: '#3b82f6', imported: false, sku: 'BC-LOGO-TEE' },
      { id: 'bc-4', name: 'Sadistic Overlord Pullover Hoodie', stock: 25, price: 45, item_type: 'One Size', border_color: '#ef4444', imported: false, sku: 'BC-OVR-HDY' },
      { id: 'bc-5', name: 'Logo Embroidered Beanie', stock: 30, price: 15, item_type: 'One Size', border_color: '#f59e0b', imported: false, sku: 'BC-LOGO-BEN' }
    ];
  });

  const [bcSyncLogs, setBcSyncLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexus_core_bc_sync_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return ['[SYSTEM] Bandcamp telemetry pipeline standby. Ready to bind artist account.'];
  });
  
  const [selectedBcImports, setSelectedBcImports] = useState<string[]>([]);

  const addBcLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    const logLine = `[${time}] ${msg}`;
    setBcSyncLogs(prev => {
      const updated = [logLine, ...prev].slice(0, 45);
      localStorage.setItem('nexus_core_bc_sync_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const [showAddNewInline, setShowAddNewInline] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    item_type: 'Multiple',
    price: 15.0,
    table_stock: 0,
    van_stock: 100,
    border_color: '#3b82f6'
  });

  // Inline "Audit" state
  const [showAuditInline, setShowAuditInline] = useState(false);
  const [auditForm, setAuditForm] = useState({
    item_id: '',
    stock_type: 'table_stock' as 'table_stock' | 'van_stock',
    quantity_lost: 1,
    reason: 'misprint' as InventoryAudit['reason'],
    notes: ''
  });

  // Dynamic calculations
  const stats = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + ((item.table_stock || 0) + (item.van_stock || 0)) * (item.price || 0), 0);
    const lowStockCount = inventory.filter(item => (item.table_stock || 0) <= 25 && (item.table_stock || 0) > 18).length;
    const criticalCount = inventory.filter(item => (item.table_stock || 0) <= 18).length;
    const totalItemsCount = inventory.length;

    // Find top item based on total stock value or name
    let topItem = 'None';
    let maxVal = 0;
    inventory.forEach(item => {
      const val = ((item.table_stock || 0) + (item.van_stock || 0)) * (item.price || 0);
      if (val > maxVal) {
        maxVal = val;
        topItem = item?.name;
      }
    });

    return {
      totalValue,
      lowStockCount,
      criticalCount,
      totalItemsCount,
      topItem
    };
  }, [inventory]);

  // Handle stock step update
  const handleStockStep = async (itemId: string, info: 'inc' | 'dec') => {
    // Optimistically update local state first
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const diff = info === 'inc' ? 1 : -1;
        const newTableStock = Math.max(0, item.table_stock + diff);
        
        let newStatus: 'Critical' | 'Warning' | 'Healthy' = 'Healthy';
        if (newTableStock <= 18) {
          newStatus = 'Critical';
        } else if (newTableStock <= 25) {
          newStatus = 'Warning';
        }

        addLog(`Adjusted Table Stock of "${item?.name}" from ${item.table_stock} to ${newTableStock}. Status of item is now ${newStatus}.`);
        
        // Asynchronously update Supabase
        const supabase = getSupabase();
        if (supabase) {
          (async () => {
             try {
               const { error } = await supabase.from('inventory').update({
                  table_stock: newTableStock,
                  status: newStatus
               }).eq('id', item.id);
               if (error) throw error;
             } catch (e: any) {
               console.error('Failed to update stock in DB:', e);
               triggerNotification('Database connection error during stock update');
             }
          })();
        }
        
        return {
          ...item,
          table_stock: newTableStock,
          status: newStatus
        };
      }
      return item;
    }));
  };

  // Filter & Sort community printers database
  const filteredPrinters = useMemo(() => {
    let result = [...printers];

    // Filter by view mode (Active, Blacklisted, All)
    if (printerViewMode === 'active') {
      result = result.filter(p => !p.blacklisted);
    } else if (printerViewMode === 'blacklisted') {
      result = result.filter(p => p.blacklisted);
    }

    // Search query
    if (printerSearchQuery.trim()) {
      const q = printerSearchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.company_name && p.company_name.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.region && p.region.toLowerCase().includes(q)) ||
        (p.specialties && (p.specialties || []).some((s: string) => s.toLowerCase().includes(q)))
      );
    }

    // Specialty filter
    if (printerSpecialtyFilter !== 'All') {
      const spec = printerSpecialtyFilter.toLowerCase();
      result = result.filter(p => 
        p.specialties && (p.specialties || []).some((s: string) => {
          if (spec === 'screenprint') {
            return s.toLowerCase().includes('screen') || s.toLowerCase().includes('tee') || s.toLowerCase().includes('hoodie');
          }
          return s.toLowerCase().includes(spec);
        })
      );
    }

    // Price Filter
    if (printerPriceFilter !== 'All') {
      result = result.filter(p => p.price_range === printerPriceFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (printerSortBy === 'rating') {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
      } else if (printerSortBy === 'likes') {
        const likesA = a.likes ?? 0;
        const likesB = b.likes ?? 0;
        return likesB - likesA;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [printers, printerSearchQuery, printerSpecialtyFilter, printerPriceFilter, printerSortBy, printerViewMode]);

  const handleToggleLikePrinter = (printerId: string) => {
    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        const liked = !p.liked_by_user;
        const diff = liked ? 1 : -1;
        triggerNotification(liked ? `Recommended "${p.name}" in the community database!` : `Removed recommendation for "${p.name}".`);
        const updated = {
          ...p,
          liked_by_user: liked,
          likes: Math.max(0, (p.likes || 0) + diff)
        };
        uploadPrinterToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  const handleAddReview = (e: React.FormEvent, printerId: string) => {
    e.preventDefault();
    if (!newReviewForm.name.trim() || !newReviewForm.text.trim()) {
      triggerNotification('Please provide a name and feedback text.');
      return;
    }

    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        const newRev = {
          name: newReviewForm.name,
          rating: newReviewForm.rating,
          text: newReviewForm.text,
          date: new Date().toISOString().split('T')[0]
        };
        const allReviews = [...(p.reviews || []), newRev];
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10;
        
        triggerNotification(`Thank you! Your rating of ${newReviewForm.rating}⭐ was added to the community database.`);
        addLog(`Submitted community feedback review for: ${p.company_name || p.name}`);
        
        const updated = {
          ...p,
          reviews: allReviews,
          rating: avgRating
        };
        uploadPrinterToCloud(updated);
        return updated;
      }
      return p;
    }));

    setNewReviewForm({ name: '', rating: 5, text: '' });
  };

  const handleBlacklistPrinter = (printerId: string, reason: string) => {
    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        triggerNotification(`"${p.company_name || p.name}" has been blacklisted.`);
        addLog(`[SECURITY] Blacklisted printer: ${p.company_name || p.name}. Reason: ${reason || 'Unspecified'}`);
        const updated = {
          ...p,
          blacklisted: true,
          blacklist_reason: reason || 'Pre-emptively blacklisted by tour manager'
        };
        uploadPrinterToCloud(updated);
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
        triggerNotification(`"${p.company_name || p.name}" has been unblacklisted and restored to active pool.`);
        addLog(`[SECURITY] Restored blacklisted printer: ${p.company_name || p.name}`);
        const updated = {
          ...p,
          blacklisted: false,
          blacklist_reason: undefined
        };
        uploadPrinterToCloud(updated);
        return updated;
      }
      return p;
    }));
  };

  // Filter & Sort inventory
  const filteredAndSortedInventory = useMemo(() => {
    let result = [...inventory];

    // Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item?.name.toLowerCase().includes(q) || 
        item.item_type.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock-asc':
          return a.table_stock - b.table_stock;
        case 'stock-desc':
          return b.table_stock - a.table_stock;
        default:
          return 0;
      }
    });

    return result;
  }, [inventory, searchQuery, sortBy, statusFilter]);

  // Add item action
  const handleCreateNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      triggerNotification('Please provide a valid merchandise name');
      return;
    }

    const brandNew: InventoryItem = {
       id: generateUUID(),
       name: newItemForm.name,
       item_type: newItemForm.item_type,
       price: Number(newItemForm.price) || 10,
       table_stock: 0,
       van_stock: Number(newItemForm.van_stock) || 0,
       status: (Number(newItemForm.van_stock) || 0) <= 18 ? 'Critical' : (Number(newItemForm.van_stock) || 0) <= 25 ? 'Warning' : 'Healthy',
       border_color: newItemForm.border_color,
       image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=200&auto=format&fit=crop',
       band_id: activeBandId
     };

    setInventory(prev => [...prev, brandNew]);
    addLog(`Added brand new merchandise asset to catalog: ${brandNew.name} ($${brandNew.price})`);
    
    // Write to Supabase with background try/catch
    const supabase = getSupabase();
    if (supabase) {
       (async() => {
          try {
             const dbItem = sanitizeInventoryItemForDb(brandNew);
             const { error } = await executeWithSchemaResilience(async (payload) => {
                return await supabase.from('inventory').insert([payload]);
             }, dbItem);
             if (error) {
                console.error("Insertion error:", error);
                triggerNotification('Warning: Database connection issue. Item saved locally.');
             }
          } catch(err) {
             console.error(err);
          }
       })();
    }

    triggerNotification(`Created merchandise: ${brandNew.name}`);
    setShowAddNewInline(false);
    setNewItemForm({
      name: '',
      item_type: 'Multiple',
      price: 15.0,
      table_stock: 50,
      van_stock: 100,
      border_color: '#3b82f6'
    });
  };

  const handlePerformAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.item_id) {
      triggerNotification('Please select an item to audit.');
      return;
    }
    if (auditForm.quantity_lost <= 0) {
      triggerNotification('Quantity must be greater than zero.');
      return;
    }

    const itemToUpdate = inventory.find(i => i.id === auditForm.item_id);
    if (!itemToUpdate) return;

    if (auditForm.stock_type === 'table_stock' && itemToUpdate.table_stock < auditForm.quantity_lost) {
      triggerNotification('Cannot deduct more than available table stock.');
      return;
    }
    if (auditForm.stock_type === 'van_stock' && itemToUpdate.van_stock < auditForm.quantity_lost) {
      triggerNotification('Cannot deduct more than available van stock.');
      return;
    }

    const newTable = auditForm.stock_type === 'table_stock' ? itemToUpdate.table_stock - auditForm.quantity_lost : itemToUpdate.table_stock;
    const newVan = auditForm.stock_type === 'van_stock' ? itemToUpdate.van_stock - auditForm.quantity_lost : itemToUpdate.van_stock;
    
    let newStatus: 'Critical' | 'Warning' | 'Healthy' = 'Healthy';
    if (newTable <= 18) newStatus = 'Critical';
    else if (newTable <= 25) newStatus = 'Warning';

    // Deduct stock locally
    setInventory(prev => prev.map(item => {
      if (item.id === itemToUpdate.id) {
        return { ...item, table_stock: newTable, van_stock: newVan, status: newStatus };
      }
      return item;
    }));

    const newAudit: InventoryAudit = {
      id: 'aud_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      item_id: itemToUpdate.id,
      item_name: itemToUpdate.name,
      quantity_change: -Math.abs(auditForm.quantity_lost),
      reason: auditForm.reason,
      notes: auditForm.notes,
      band_id: activeBandId
    };

    // Record audit locally
    if (setInventoryAudits) {
      setInventoryAudits(prev => [newAudit, ...prev]);
    }

    // Write to Supabase with background try/catch
    const supabase = getSupabase();
    if (supabase) {
       (async() => {
          try {
             // Update stock
             await supabase.from('inventory').update({ 
               table_stock: newTable, 
               van_stock: newVan, 
               status: newStatus 
             }).eq('id', itemToUpdate.id);
             
             // Insert audit
             const dbAudit = { ...newAudit };
             delete (dbAudit as any).band_id;
             await supabase.from('inventory_audits').insert([dbAudit]);
          } catch(err) {
             console.error("Audit write DB error:", err);
             triggerNotification('Warning: Database connection issue. Audit saved locally.');
          }
       })();
    }

    addLog(`Audit Logged: Reduced ${itemToUpdate.name} by ${auditForm.quantity_lost} (${auditForm.reason}).`);
    triggerNotification('Inventory audit recorded successfully.');
    setShowAuditInline(false);
    setAuditForm(prev => ({ ...prev, quantity_lost: 1, notes: '' }));
  };

  return (
    <div className="w-full flex flex-col text-[#f3f4f6] relative z-10">
      
      {/* HEADER SECTION METADATA */}
      <div className="relative border-b border-[#1b1e25] pb-4 pt-4 flex flex-col items-center justify-center text-center bg-[#0c0e12]/90 backdrop-blur-md sticky top-0 z-40 gap-3">
        
        {/* Centered Title Lockup */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <h1 
              className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white uppercase text-center select-text leading-none"
              style={{
                textShadow: '0 0 12px rgba(139, 92, 246, 0.4), 0 0 25px rgba(109, 40, 217, 0.35), 0 0 50px rgba(167, 139, 250, 0.2)',
                letterSpacing: '0.1em',
                fontWeight: 950,
                fontSize: '38px',
                lineHeight: '1.1',
                marginLeft: '0px',
                marginTop: '0px'
              }}
            >
              Inventory<br />Manager
            </h1>
          </motion.div>
          <p 
            className="text-[10px] text-zinc-400 font-mono tracking-wide max-w-[320px] mx-auto leading-relaxed text-center"
            style={{ marginTop: '-4px', fontSize: '10px' }}
          >
            Your frontline merchandise counting house. Lock down physical stock controls, trace complete audit histories, execute immediate van-to-table transfers to ensure you are always fully stocked, and deploy precise low-stock alerts before a sell-out.
          </p>
        </div>
      </div>

      {/* STATS TILES ROW - COMPACT LAYOUT */}
      <div className="w-full overflow-x-auto scrollbar-none">
        <div className="px-5 py-4 flex gap-3 min-w-[560px]">
          {/* TOTAL VALUE STAT CARD */}
          <div className="bg-[#121c16]/70 border border-[#00d195]/30 rounded-xl p-3 flex-1 flex flex-col justify-between relative group hover:border-[#00d195]/60 transition-all min-w-[130px]">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                <span className="text-emerald-400 text-xs font-bold">$</span> TOTAL VALUE
              </span>
              <div className="flex items-baseline mt-1 gap-2 whitespace-nowrap">
                <span className="text-[22px] font-bold font-display text-white tracking-tight whitespace-nowrap">
                  ${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <span className="text-[9px] text-[#00ffcc] font-mono flex items-center justify-center gap-1 mt-2 bg-[#00ffcc]/10 self-center px-1.5 py-0.5 rounded whitespace-nowrap shadow-[0_0_8px_rgba(0,255,204,0.08)]">
              <TrendingUp className="w-3 h-3 text-[#00ffcc]" />
              +12% vs last month
            </span>
          </div>

          {/* LOW STOCK CARD */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'Warning' ? 'all' : 'Warning')}
            className={`cursor-pointer hover:scale-[1.02] active:scale-95 bg-[#241c0e]/70 rounded-xl p-3 flex-1 flex flex-col justify-between relative transition-all min-w-[130px] border ${
              statusFilter === 'Warning' 
                ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.35)] font-bold' 
                : 'border-amber-600/30 hover:border-amber-500/60'
            }`}
          >
            <div>
              <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> LOW STOCK
              </span>
              <div className="flex items-baseline mt-1 whitespace-nowrap">
                <span className="text-[22px] font-bold font-display text-white tracking-tight whitespace-nowrap">
                  {stats.lowStockCount}
                </span>
              </div>
            </div>
            <span className="text-[9px] text-amber-400 font-mono mt-2 block whitespace-nowrap">
              {stats.lowStockCount} items need reorder {statusFilter === 'Warning' ? '• ACTIVE' : ''}
            </span>
          </div>

          {/* CRITICAL CARD */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'Critical' ? 'all' : 'Critical')}
            className={`cursor-pointer hover:scale-[1.02] active:scale-95 bg-[#2a1315]/70 rounded-xl p-3 flex-1 flex flex-col justify-between relative transition-all min-w-[130px] border ${
              statusFilter === 'Critical' 
                ? 'border-red-500 ring-4 ring-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.35)] font-bold' 
                : 'border-red-600/30 hover:border-red-500/60'
            }`}
          >
            <div>
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" /> CRITICAL
              </span>
              <div className="flex items-baseline mt-1 whitespace-nowrap">
                <span className="text-[22px] font-bold font-display text-white tracking-tight whitespace-nowrap">
                  {stats.criticalCount}
                </span>
              </div>
            </div>
            <span className="text-[9px] text-red-400 font-mono mt-2 block whitespace-nowrap">
              {stats.criticalCount} items urgent {statusFilter === 'Critical' ? '• ACTIVE' : ''}
            </span>
          </div>

          {/* TOTAL ITEMS CARD */}
          <div className="bg-[#13161d]/70 border border-zinc-800 rounded-xl p-3 flex-1 flex flex-col justify-between hover:border-zinc-700 transition-all min-w-[130px]">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                <Star className="w-3.5 h-3.5 text-zinc-400" /> TOTAL ITEMS
              </span>
              <div className="flex items-baseline mt-1 whitespace-nowrap">
                <span className="text-[22px] font-bold font-display text-white tracking-tight whitespace-nowrap">
                  {stats.totalItemsCount}
                </span>
              </div>
            </div>
            <span className="text-[9px] text-zinc-400 font-mono mt-2 truncate block whitespace-nowrap" title={stats.topItem}>
              Top: {stats.topItem.substring(0, 15)}...
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH MERCHANDISE INPUT FIELD */}
      <div className="px-5 py-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search Merchandise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#13161d] border-2 border-[#252830] focus:border-[#00ffcc]/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none placeholder-zinc-500 font-mono transition-all"
          />
        </div>
      </div>

      {/* FILTER VIEW CONTROLS & GRID DROPDOWN */}
      <div className="px-5 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* List and Grid view toggler buttons */}
          <button 
            type="button" 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'list' 
                ? 'bg-[#00ffcc] text-black border-[#00ffcc]' 
                : 'bg-[#13161d] border-[#252830] text-zinc-400 hover:text-white'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          
          <button 
            type="button" 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'grid' 
                ? 'bg-[#00ffcc] text-black border-[#00ffcc]' 
                : 'bg-[#13161d] border-[#252830] text-zinc-400 hover:text-white'
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button 
            type="button" 
            onClick={() => setViewMode('audit')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'audit' 
                ? 'bg-[#00ffcc] text-black border-[#00ffcc]' 
                : 'bg-[#13161d] border-[#252830] text-zinc-400 hover:text-white'
            }`}
            title="Audit Log"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {/* Filter toggle button */}
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
              showFilters || statusFilter !== 'all'
                ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                : 'bg-[#13161d] border-[#252830] text-zinc-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Select matching modern dropdown visuals */}
        <div className="relative flex-1 max-w-[140px]">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-[#181a21]/90 border border-zinc-700/80 rounded px-2.5 py-1 text-xs font-mono font-bold text-zinc-300 focus:outline-none cursor-pointer appearance-none text-center block"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price: Low-High</option>
            <option value="price-desc">Price: High-Low</option>
            <option value="stock-asc">Stock: Low-High</option>
            <option value="stock-desc">Stock: High-Low</option>
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none text-zinc-500">▼</span>
        </div>
      </div>

      {/* FILTER BUTTON DRAWER ITEMS COLLAPSIBLE */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 overflow-hidden"
          >
            <div className="bg-[#13161d] border border-[#252830] rounded-xl p-3 flex flex-wrap gap-1.5 items-center mt-2">
              <span className="text-xs font-mono text-zinc-400 block mr-2 w-full mb-1">Filter by Health:</span>
              {(['all', 'Healthy', 'Warning', 'Critical'] as const).map((status, idx) => (
                <button
                  key={`${status}-${idx}`}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                    statusFilter === status 
                      ? 'bg-teal-400 text-black' 
                      : 'bg-[#181d26] text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE CONTROL ACTION BUTTONS */}
      <div className="px-5 py-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => {
              if (onAddNew) onAddNew();
              else {
                setShowAddNewInline(!showAddNewInline);
                setShowAuditInline(false);
              }
            }}
            className="w-full bg-[#00ffd2]/10 border border-[#00ffd2]/30 hover:bg-[#00ffd2]/20 hover:border-[#00ffd2]/60 hover:shadow-[0_0_18px_rgba(0,253,210,0.25)] active:scale-95 transition-all text-[#00ffd2] font-semibold rounded-xl py-2 flex flex-col items-center justify-center gap-1 cursor-pointer flash-glow-cyan"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Add Item</span>
          </button>

          <button 
            onClick={() => {
              if (onOpenTransferModal) {
                onOpenTransferModal();
              }
            }}
            className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25 hover:border-amber-500/60 hover:shadow-[0_0_18px_rgba(245,158,11,0.25)] active:scale-95 transition-all font-semibold rounded-xl py-2 flex flex-col items-center justify-center gap-1 cursor-pointer flash-glow-amber"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Van Transfer</span>
          </button>
        </div>

        <button 
          onClick={() => { setShowAuditInline(!showAuditInline); setShowAddNewInline(false); }}
          className="w-full bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all font-semibold rounded-xl py-2 flex items-center justify-center gap-2 cursor-pointer cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-wider font-mono font-bold">Log Inventory Discrepancy (Audit)</span>
        </button>

        <button 
          type="button"
          onClick={() => onNavigateToPrinters ? onNavigateToPrinters() : setIsPrintersModalOpen(true)}
          className="w-full bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] hover:bg-[#00ffcc]/17 hover:shadow-[0_0_12px_rgba(0,255,204,0.15)] active:scale-95 transition-all font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-wider font-mono font-bold">Need to re-stock? click here!</span>
        </button>

        <button 
          type="button"
          onClick={() => {
            if (onGoToPublicStore) {
              onGoToPublicStore();
            }
          }}
          className="w-full bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/17 hover:border-purple-500/50 active:scale-95 transition-all font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
        >
          <ShoppingBag className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider font-mono font-bold">GO TO YOUR PUBLIC STOREFRONT</span>
        </button>
      </div>

      {/* INLINE ACTION PANEL: ADD NEW MERCHANDISE */}
      <AnimatePresence>
        {showAddNewInline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 overflow-hidden"
          >
            <form onSubmit={handleCreateNewItemSubmit} className="bg-[#181d26] border border-teal-500/20 rounded-2xl p-4 mt-2 mb-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest">Create New Merchandise</span>
                <button type="button" onClick={() => setShowAddNewInline(false)} className="text-xs text-zinc-500 hover:text-white">✕</button>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Product Title</label>
                <input 
                  type="text" 
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Acts of Sadistic Cruelty CD" 
                  className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Category type</label>
                  <select 
                    value={newItemForm.item_type} 
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, item_type: e.target.value }))}
                    className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="CD">CD</option>
                    <option value="Multiple">Multiple (T-shirt)</option>
                    <option value="One Size">One Size</option>
                    <option value="Wall Flag">Wall Flag</option>
                    <option value="Sticker">Sticker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Selling Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newItemForm.price}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Table Stock</label>
                  <input 
                    type="number" 
                    value={0}
                    disabled
                    className="w-full bg-[#13161d]/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-500 focus:outline-none cursor-not-allowed font-mono"
                  />
                  <span className="text-[9px] text-zinc-500 font-mono italic block mt-0.5">*Starts empty. Move via Van Transfer prior to show.</span>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Van Stock (Initial Quantity)</label>
                  <input 
                    type="number" 
                    value={newItemForm.van_stock}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, van_stock: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Border Tint Accent</label>
                <div className="flex gap-2.5 pt-1">
                  {['#a855f7', '#3b82f6', '#eab308', '#10b981', '#ef4444'].map((c, cIdx) => (
                    <button
                      key={`${c}-${cIdx}`}
                      type="button"
                      onClick={() => setNewItemForm(prev => ({ ...prev, border_color: c }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        newItemForm.border_color === c ? 'border-white scale-110 shadow-lg' : 'border-black/50'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-teal-400 text-black py-2 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-teal-300 transition-colors"
              >
                Create Product Row
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INLINE ACTION PANEL: AUDIT */}
      <AnimatePresence>
        {showAuditInline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 overflow-hidden"
          >
            <form onSubmit={handlePerformAudit} className="bg-[#1f1515] border border-red-600/30 rounded-2xl p-4 mt-2 mb-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Log Discrepancy
                </span>
                <button type="button" onClick={() => setShowAuditInline(false)} className="text-xs text-zinc-500 hover:text-white">✕</button>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Select Item</label>
                <select 
                  value={auditForm.item_id}
                  onChange={(e) => setAuditForm(prev => ({ ...prev, item_id: e.target.value }))}
                  className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-400"
                >
                  <option value="">-- Choose Merchandise --</option>
                  {inventory.map((item, idx) => (
                    <option key={`${item.id}-${idx}`} value={item.id}>{item?.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Stock Location</label>
                  <select 
                    value={auditForm.stock_type}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, stock_type: e.target.value as any }))}
                    className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-400"
                  >
                    <option value="table_stock">Table Stock</option>
                    <option value="van_stock">Van Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Qty Reduced By</label>
                  <input 
                    type="number"
                    min="1"
                    value={auditForm.quantity_lost}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, quantity_lost: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Reason</label>
                <select 
                  value={auditForm.reason}
                  onChange={(e) => setAuditForm(prev => ({ ...prev, reason: e.target.value as any }))}
                  className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-400"
                >
                  <option value="misprint">Misprint / Defective</option>
                  <option value="damaged">Damaged in Transit</option>
                  <option value="giveaway">Promo / Giveaway</option>
                  <option value="trade">Band Trade</option>
                  <option value="lost">Lost / Stolen</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Optional Notes</label>
                <input 
                  type="text"
                  placeholder="e.g. Gave to sound guy"
                  value={auditForm.notes}
                  onChange={(e) => setAuditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-400"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-red-500 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-red-400 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Confirm Inventory Reduction
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BANDCAMP INTEGRATION HUB PANEL */}
      <AnimatePresence>
        {false && showBandcampPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 overflow-hidden"
          >
            <div className="bg-[#11141a] border border-purple-500/25 rounded-2xl p-4.5 mt-2 mb-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#252830] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1ca8a2]/15 flex items-center justify-center border border-[#1cb0a9]/30">
                    <Disc className="w-4 h-4 text-[#1cb0a9] animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-mono font-black text-purple-400 uppercase tracking-widest block">Bandcamp Sync Engine</span>
                    <span className="text-[9.5px] text-zinc-400 font-mono">Two-Way Inventory & Merch Catalog Importer</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowBandcampPanel(false)} 
                  className="text-xs text-zinc-500 hover:text-white bg-black/20 p-1.5 rounded-lg border border-zinc-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Banner / Unconnected Setup Form */}
              {!bcConnected ? (
                <div className="space-y-3.5 bg-black/20 p-3.5 rounded-xl border border-[#252830]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider text-[#1cb0a9] uppercase font-bold">Integration Method:</span>
                    <div className="flex gap-1.5">
                      {(['sandbox', 'partner_api'] as const).map((mode, idx) => (
                        <button
                          key={`${mode}-${idx}`}
                          type="button"
                          onClick={() => setBcAccountType(mode)}
                          className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            bcAccountType === mode 
                              ? 'bg-[#1ca8a2] text-black shadow-sm' 
                              : 'bg-[#181d26] text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {mode === 'sandbox' ? 'Sandbox Mode' : 'Merchant API Key'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {bcAccountType === 'partner_api' ? (
                    <div className="space-y-2.5 pt-1.5 text-left">
                      <div>
                        <label className="block text-[8.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Bandcamp Client ID</label>
                        <input 
                          type="text" 
                          value={bcClientId}
                          onChange={(e) => { setBcClientId(e.target.value); localStorage.setItem('nexus_core_bc_client_id', e.target.value); }}
                          placeholder="e.g. 52391" 
                          className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[8.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Client Secret</label>
                          <input 
                            type="password" 
                            value={bcClientSecret}
                            onChange={(e) => { setBcClientSecret(e.target.value); localStorage.setItem('nexus_core_bc_client_secret', e.target.value); }}
                            placeholder="••••••••" 
                            className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[8.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Artist Band ID</label>
                          <input 
                            type="text" 
                            value={bcBandId}
                            onChange={(e) => { setBcBandId(e.target.value); localStorage.setItem('nexus_core_bc_band_id', e.target.value); }}
                            placeholder="e.g. 8942201" 
                            className="w-full bg-[#13161d] border border-zinc-700 rounded-lg p-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1ca8a2]/5 border border-[#1ca8a2]/25 rounded-md p-3 text-[10.5px] leading-relaxed text-zinc-300 text-left">
                      ⚡ <span className="font-bold text-[#1ca8a2]">Instant Sandbox Connection:</span> Test and experience catalog imports and live 2-way syncing instantly with simulated store datasets, custom logs, and real database write interactions!
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isConnectingBc}
                    onClick={async () => {
                      setIsConnectingBc(true);
                      addBcLog(`[AUTH] Contacting Bandcamp OAuth Server at https://bandcamp.com/oauth/token...`);
                      if (bcAccountType === 'partner_api') {
                        if (!bcClientId.trim() || !bcClientSecret.trim() || !bcBandId.trim()) {
                          triggerNotification('Credentials missing. Fill out all client credentials keys.');
                          addBcLog(`[ERROR] Connection failed: client details are incomplete.`);
                          setIsConnectingBc(false);
                          return;
                        }
                        addBcLog(`[AUTH] Authenticating Client credentials Grant: query client_id: "${bcClientId.slice(0, 4)}***"`);
                      }
                      
                      // Realistic server transition delay
                      await new Promise(r => setTimeout(r, 1400));
                      
                      setBcConnected(true);
                      localStorage.setItem('nexus_core_bc_connected', 'true');
                      localStorage.setItem('nexus_core_bc_acct_type', bcAccountType);
                      setIsConnectingBc(false);
                      triggerNotification('🦊 Bandcamp Account Linked & Authenticated Successfully!');
                      addBcLog(`[AUTH] Grant type client_credentials authorized by Bandcamp.`);
                      addBcLog(`[SUCCESS] Connected to Bandcamp Merchant Profile ID: '${bcAccountType === 'partner_api' ? bcBandId : '8942201'}'.`);
                    }}
                    className="w-full mt-1.5 py-2.5 bg-[#1cb0a9] text-black font-black uppercase tracking-wider font-mono text-[10px] rounded-xl hover:bg-[#1fa19c] active:scale-97 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md shadow-[#1ca8a2]/10"
                  >
                    {isConnectingBc ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Linking Bandcamp Account...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 text-black" />
                        Link Bandcamp Account
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Connected Dashboard */
                <div className="space-y-4">
                  {/* Connected Info Header */}
                  <div className="bg-black/20 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <div className="leading-tight text-left">
                        <span className="text-[10px] font-mono text-zinc-400 block">CONNECTED ACCOUNT</span>
                        <span className="text-xs font-black text-white hover:text-[#1cb0a9] transition-colors flex items-center gap-1 cursor-pointer">
                          Bandcamp ID: {bcAccountType === 'partner_api' ? bcBandId : '8942201'} ({bcAccountType === 'partner_api' ? 'Prod API' : 'Sandbox'})
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBcConnected(false);
                        localStorage.setItem('nexus_core_bc_connected', 'false');
                        triggerNotification('Bandcamp account unlinked.');
                        addBcLog(`[SYSTEM] Account integration manually disconnected.`);
                      }}
                      className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/45 text-red-400 hover:text-red-300 rounded-lg text-[9px] font-mono border border-red-900/40 hover:border-red-800/60 uppercase transition-all cursor-pointer font-extrabold"
                    >
                      Unlink Account
                    </button>
                  </div>

                  {/* Segment: Catalogue Importer */}
                  <div className="bg-black/20 p-3.5 border border-purple-500/10 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-mono font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-purple-400" /> 1. Import Merch Catalogue
                      </h5>
                      <span className="text-[9px] font-mono text-zinc-500 font-extrabold">
                        {bcCatalog.filter(c => {
                          return (inventory || []).some(i => i.name.toLowerCase() === c.name.toLowerCase() || i.sku === c.sku);
                        }).length} / {bcCatalog.length} Linked
                      </span>
                    </div>
                    <p className="text-[9.5px] leading-relaxed text-zinc-400 text-left">
                      Import active merchandise items listed on your Bandcamp profile store into this app's live inventory to bypass manual listing entries:
                    </p>

                    <div className="max-h-[145px] overflow-y-auto border border-zinc-800 rounded-xl bg-black/15 divide-y divide-[#1e222b] text-left">
                      {bcCatalog.map((item, idx) => {
                        const isAlreadyImported = (inventory || []).some(i => i.name.toLowerCase() === item?.name.toLowerCase() || i.sku === item.sku);
                        const isChecked = selectedBcImports.includes(item.id);

                        return (
                          <div key={`${item.id}-${idx}`} className="p-2 py-2.5 flex items-center justify-between gap-2 hover:bg-black/10 transition-all">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {isAlreadyImported ? (
                                <div className="w-4.5 h-4.5 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedBcImports(prev => prev.filter(id => id !== item.id));
                                    } else {
                                      setSelectedBcImports(prev => [...prev, item.id]);
                                    }
                                  }}
                                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                                />
                              )}
                              <div className="min-w-0">
                                <span className="text-[11.5px] font-bold text-zinc-250 block truncate">{item?.name}</span>
                                <div className="flex items-center gap-2 mt-0.5 text-[8.5px] font-mono text-zinc-500 font-bold uppercase">
                                  <span>SKU: {item.sku}</span>
                                  <span>•</span>
                                  <span className="text-purple-400">{item.item_type}</span>
                                  <span>•</span>
                                  <span className="text-[#1ca8a2]">BC Stock: {item.stock}</span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 text-right pr-1">
                              <span className="text-xs font-black text-white font-mono">${item.price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={selectedBcImports.length === 0 || isImportingBc}
                      onClick={async () => {
                        setIsImportingBc(true);
                        addBcLog(`[IMPORT] Beginning batch catalog import for ${selectedBcImports.length} items...`);
                        
                        await new Promise(r => setTimeout(r, 1100));

                        let importCount = 0;
                        const finalUpdatedInventory = [...inventory];
                        const supabase = getSupabase();

                        for (const importId of selectedBcImports) {
                          const catalogueItem = bcCatalog.find(bc => bc.id === importId);
                          if (catalogueItem) {
                            const newUuid = generateUUID();
                            const brandNew: InventoryItem = {
                              id: newUuid,
                              name: catalogueItem.name,
                              item_type: catalogueItem.item_type === 'Vinyl' ? 'Vinyl' : catalogueItem.item_type === 'Audio Cassette' ? 'Audio Cassette' : 'One Size',
                              price: catalogueItem.price,
                              table_stock: catalogueItem.stock,
                              van_stock: 0,
                              status: catalogueItem.stock <= 18 ? 'Critical' : catalogueItem.stock <= 25 ? 'Warning' : 'Healthy',
                              border_color: catalogueItem.border_color,
                              image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=200&auto=format&fit=crop',
                              band_id: activeBandId,
                              sku: catalogueItem.sku,
                              cost: Math.round(catalogueItem.price * 0.45)
                            };

                            finalUpdatedInventory.push(brandNew);
                            importCount++;

                            // Async DB Save if Supabase is connected
                            if (supabase) {
                              try {
                                const dbItem = sanitizeInventoryItemForDb(brandNew);
                                await supabase.from('inventory').insert([dbItem]);
                              } catch (e) {
                                console.error('Error importing item to Supabase table:', e);
                              }
                            }
                          }
                        }

                        setInventory(finalUpdatedInventory);
                        addBcLog(`[SUCCESS] Imported ${importCount} new products from Bandcamp to current tour stocks.`);
                        
                        // Show all catalog items as imported internally in state
                        setBcCatalog(prev => prev.map(c => selectedBcImports.includes(c.id) ? { ...c, imported: true } : c));
                        setSelectedBcImports([]);
                        setIsImportingBc(false);
                        triggerNotification(`Successfully imported ${importCount} catalog items!`);
                      }}
                      className="w-full py-2 bg-purple-650 hover:bg-purple-550 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent text-white font-black uppercase text-[10px] tracking-wider font-mono rounded-xl active:scale-95 transition-all shadow-md shadow-purple-650/15 cursor-pointer flex items-center justify-center gap-2 border border-purple-500/20"
                    >
                      {isImportingBc ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Importing Selected Assets...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Import Selected Catalogs ({selectedBcImports.length})
                        </>
                      )}
                    </button>
                  </div>

                  {/* Segment: Two-Way Synchronization Management */}
                  <div className="bg-black/20 p-3.5 border border-teal-500/10 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between font-bold">
                      <h5 className="text-[10px] font-mono font-black text-teal-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-teal-400" /> 2. Two-Way Sync Dashboard
                      </h5>
                      <span className="text-[9px] font-mono text-zinc-500 font-extrabold uppercase">Live Alignment</span>
                    </div>
                    <p className="text-[9.5px] leading-relaxed text-zinc-400 text-left">
                      Below are mapped items matching Bandcamp catalogues by SKU details. Select how to align stock discrepancies:
                    </p>

                    {/* Mapped Synchronization Table */}
                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black/15 text-left text-xs">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-black/35 border-b border-zinc-800 text-[8.5px] font-mono text-zinc-500 uppercase font-black tracking-widest">
                        <div className="col-span-4">PRODUCT (SKU)</div>
                        <div className="col-span-2 text-center">APP tour</div>
                        <div className="col-span-2 text-center">BANDCAMP</div>
                        <div className="col-span-4 text-right">DISCREPANCY ACTION</div>
                      </div>

                      {/* Display matched items */}
                      {(() => {
                        const matched = bcCatalog.map(bcItem => {
                          const appItem = inventory.find(invItem => invItem.name.toLowerCase() === bcItem.name.toLowerCase() || invItem.sku === bcItem.sku);
                          return { bcItem, appItem };
                        }).filter(pair => pair.appItem !== undefined);

                        if (matched.length === 0) {
                          return (
                            <div className="py-6 text-center text-[10px] text-zinc-500 font-mono">
                              No synced core inventory items found.<br/>Import catalog items above to sync!
                            </div>
                          );
                        }

                        return (
                          <div className="divide-y divide-[#1d222b] max-h-[190px] overflow-y-auto">
                            {matched.map(({ bcItem, appItem }, idx) => {
                              if (!appItem) return null;
                              const appTotalStock = appItem.table_stock + appItem.van_stock;
                              const isInSync = appTotalStock === bcItem.stock;

                              return (
                                <div key={`${bcItem.id}-${idx}`} className="grid grid-cols-12 gap-1 px-3 py-2.5 items-center hover:bg-black/10 transition-colors">
                                  {/* Title SKU column */}
                                  <div className="col-span-4 min-w-0 pr-1.5 leading-tight">
                                    <span className="text-[11px] font-bold text-zinc-250 block truncate">{appItem.name}</span>
                                    <span className="text-[8.5px] font-mono text-zinc-650 block truncate uppercase">{bcItem.sku}</span>
                                  </div>

                                  {/* App Stock Column */}
                                  <div className="col-span-2 text-center font-mono">
                                    <span className="text-white font-extrabold">{appTotalStock}</span>
                                    <span className="text-[8px] text-zinc-550 block">sum: {appItem.table_stock}t/{appItem.van_stock}v</span>
                                  </div>

                                  {/* Bandcamp Stock Column */}
                                  <div className="col-span-2 text-center font-mono font-bold text-[#1ca8a2]">
                                    {bcItem.stock}
                                  </div>

                                  {/* Mapped Align action column */}
                                  <div className="col-span-4 flex items-center justify-end gap-1 select-none pr-1">
                                    {isInSync ? (
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8.5px] font-mono uppercase tracking-wide">
                                        ✓ Synced
                                      </span>
                                    ) : (
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          title="Overwrite Bandcamp online stock with our current local tour stock count"
                                          onClick={async () => {
                                            const originalBcStock = bcItem.stock;
                                            setBcCatalog(prev => prev.map(bc => bc.id === bcItem.id ? { ...bc, stock: appTotalStock } : bc));
                                            
                                            addBcLog(`[SYNC] Pushed tour stock of '${appItem.name}' (${appTotalStock}) to Bandcamp API.`);
                                            addBcLog(`[SYNC] Bandcamp inventory updated: ${originalBcStock} ➔ ${appTotalStock}`);
                                            triggerNotification(`Pushed ${appItem.name} stock level to Bandcamp!`);
                                          }}
                                          className="px-1.5 py-0.5 bg-[#1cb0a9]/15 hover:bg-[#1cb0a9]/35 border border-[#1cb0a9]/40 text-[#1cb0a9] text-[8px] font-mono font-bold uppercase rounded cursor-pointer transition-colors"
                                        >
                                          Push App
                                        </button>
                                        <button
                                          type="button"
                                          title="Pull online web sales from Bandcamp to update tour quantities"
                                          onClick={async () => {
                                            const originalAppTable = appItem.table_stock;
                                            setInventory(prev => prev.map(inv => {
                                              if (inv.id === appItem.id) {
                                                const diff = bcItem.stock - appTotalStock;
                                                const finalTable = Math.max(0, inv.table_stock + diff);
                                                return { ...inv, table_stock: finalTable };
                                              }
                                              return inv;
                                            }));

                                            addBcLog(`[SYNC] Pulled Bandcamp web sales stock for '${appItem.name}' into App table stock.`);
                                            addBcLog(`[SYNC] Local assets stock alignment: ${originalAppTable} ➔ ${Math.max(0, appItem.table_stock + (bcItem.stock - appTotalStock))}`);
                                            triggerNotification(`Pulled online sales for ${appItem.name}!`);
                                          }}
                                          className="px-1.5 py-0.5 bg-indigo-500/15 hover:bg-indigo-500/35 border border-indigo-400/40 text-[#a5b4fc] text-[8px] font-mono font-bold uppercase rounded cursor-pointer transition-colors"
                                        >
                                          Pull online
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Run full master alignment check */}
                    <button
                      type="button"
                      disabled={isSyncingBc || !(bcCatalog || []).some(bc => (inventory || []).some(i => i.name.toLowerCase() === bc.name.toLowerCase() || i.sku === bc.sku))}
                      onClick={async () => {
                        setIsSyncingBc(true);
                        addBcLog(`[ALIGN] Invoking bulk two-way harmonization pipeline...`);
                        addBcLog(`[ALIGN] Analysing database lock schemas and syncing items...`);
                        
                        await new Promise(r => setTimeout(r, 1500));

                        let updatedCount = 0;
                        const finalUpdatedBcCatalog = [...bcCatalog];
                        const finalUpdatedInventory = [...inventory];
                        const supabase = getSupabase();

                        finalUpdatedBcCatalog.forEach((bcItem, idx) => {
                          const appItemIndex = finalUpdatedInventory.findIndex(inv => inv.name.toLowerCase() === bcItem.name.toLowerCase() || inv.sku === bcItem.sku);
                          if (appItemIndex !== -1) {
                            const appItem = finalUpdatedInventory[appItemIndex];
                            const appTotalStock = appItem.table_stock + appItem.van_stock;

                            if (appTotalStock !== bcItem.stock) {
                              const originalBc = bcItem.stock;
                              bcItem.stock = appTotalStock;
                              finalUpdatedBcCatalog[idx] = { ...bcItem };
                              updatedCount++;

                              addBcLog(`[ALIGN] Force Synchronized: '${appItem.name}' online stock aligned matching App tour stock (${appTotalStock}).`);
                              
                              if (supabase) {
                                (async () => {
                                  try {
                                    await supabase.from('inventory').update({
                                      table_stock: appItem.table_stock,
                                      status: appItem.status
                                    }).eq('id', appItem.id);
                                  } catch (e) {
                                    console.error('Error in multi-item sync update:', e);
                                  }
                                })();
                              }
                            }
                          }
                        });

                        setBcCatalog(finalUpdatedBcCatalog);
                        setIsSyncingBc(false);
                        triggerNotification(`Catalog Alignment Successful. Updated ${updatedCount} products.`);
                        addBcLog(`[SUCCESS] Full two-way alignment sync finished. Locked down quantities: ${updatedCount} altered.`);
                      }}
                      className="w-full py-2.5 bg-[#f59e0b] hover:bg-[#d97706] disabled:bg-zinc-850 disabled:text-zinc-650 disabled:border-transparent text-black font-black uppercase text-[10.5px] tracking-wider font-mono rounded-xl active:scale-97 transition-all shadow-md shadow-amber-500/15 cursor-pointer flex items-center justify-center gap-2 border border-[#483a21] font-bold"
                    >
                      {isSyncingBc ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Comparing & Syncing Items...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 text-black" />
                          Push Remaining Tour Counts to Bandcamp
                        </>
                      )}
                    </button>
                  </div>

                  {/* Operational Telemetry Terminal Log Container */}
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-widest pl-1">Live Integration Terminal Telemetry</span>
                    <div className="bg-black/85 border border-purple-500/15 p-3 rounded-xl font-mono text-[9px] leading-relaxed text-zinc-300 overflow-y-auto max-h-[110px] block space-y-1 select-text scrollbar-thin">
                      {bcSyncLogs.map((log, i) => {
                        let colorClass = 'text-zinc-400';
                        if (log.includes('[SUCCESS]')) colorClass = 'text-emerald-400 font-bold';
                        else if (log.includes('[ERROR]')) colorClass = 'text-rose-400 font-bold';
                        else if (log.includes('[AUTH]')) colorClass = 'text-cyan-400 font-bold';
                        else if (log.includes('[SYNC]')) colorClass = 'text-amber-400';
                        else if (log.includes('[IMPORT]')) colorClass = 'text-purple-400';

                        return (
                          <div key={`inv-col-item-${i}`} className={`${colorClass} truncate`}>
                            {log}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRIMARY GRID / LIST CONTAINER */}
      <div className="px-5 pb-12 mt-2">
        {viewMode === 'audit' ? (
          <div className="space-y-2">
            {inventoryAudits.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 flex flex-col items-center justify-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-zinc-600" />
                <p className="text-zinc-500 font-mono text-[11px] uppercase tracking-wider">No audits logged yet</p>
              </div>
            ) : (
              inventoryAudits.map((audit, idx) => (
                <div key={`${audit.id}-${idx}`} className="bg-[#1f1515] border border-red-500/20 rounded-xl p-3 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white max-w-[60%] truncate">{audit.item_name}</span>
                    <span className="text-[10px] bg-red-500 text-white font-mono font-bold px-1.5 py-0.5 rounded shadow">
                      {audit.quantity_change > 0 ? `+${audit.quantity_change}` : audit.quantity_change}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 capitalize bg-black/40 px-1.5 py-0.5 rounded border border-zinc-800">
                      Reason: {audit.reason}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600">
                      {new Date(audit.created_at).toLocaleDateString()} {new Date(audit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {audit.notes && (
                    <p className="text-[10px] text-zinc-500 font-mono bg-black/20 p-1.5 rounded mt-0.5">
                      "{audit.notes}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        ) : filteredAndSortedInventory.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 flex flex-col items-center justify-center space-y-2">
            <span className="text-2xl">📦</span>
            <p className="text-zinc-500 font-mono text-xs">No merchandise matches your current view filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          
          /* GRID VIEW - BENTO DOUBLE-BORDERED PANEL ARTWORKS */
          <div className="grid grid-cols-2 gap-3.5">
            {filteredAndSortedInventory.map((item, idx) => {
              // Custom health status tint
              let healthStateColor = 'bg-emerald-400';
              if (item.status === 'Warning') healthStateColor = 'bg-amber-400 animate-pulse';
              if (item.status === 'Critical') healthStateColor = 'bg-red-400 animate-pulse';

              // Visual highlight border
              const colorTint = item.border_color || '#3b82f6';
              const isWarningActive = statusFilter === 'Warning' && item.status === 'Warning';
              const isCriticalActive = statusFilter === 'Critical' && item.status === 'Critical';
              const isHighlighted = isWarningActive || isCriticalActive;

              return (
                <div 
                  key={`${item.id}-${idx}`} 
                  onClick={() => onEditItem?.(item)}
                  className={`bg-[#0b0c0f] rounded-2xl relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between cursor-pointer ${
                    isHighlighted ? 'ring-2 ring-offset-2 ring-offset-black animate-pulse' : ''
                  }`}
                  style={{ 
                    border: isHighlighted
                      ? `2px solid ${item.status === 'Warning' ? '#f59e0b' : '#ef4444'}`
                      : `1.5px solid ${colorTint}44`,
                    boxShadow: isHighlighted
                      ? `0 0 25px ${item.status === 'Warning' ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'}`
                      : `0 4px 20px -5px ${colorTint}15`,
                    borderColor: isHighlighted
                      ? (item.status === 'Warning' ? '#f59e0b' : '#ef4444')
                      : undefined
                  }}
                >
                  {/* Subtle neon drop line */}
                  <div 
                    className="absolute top-0 inset-x-0 h-1 pointer-events-none" 
                    style={{ backgroundColor: isHighlighted ? (item.status === 'Warning' ? '#f59e0b' : '#ef4444') : colorTint }}
                  />

                  {/* Artwork / Image block */}
                  <div className="w-full h-32 relative bg-zinc-900 overflow-hidden select-none">
                    <img 
                      src={resolveInventoryImageUrl(item)} 
                      alt={item?.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Gradient shading */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    {/* Active Health dot indicator upper right */}
                    <span className={`absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full ring-2 ring-black ${healthStateColor}`} />

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
                        {item.is_synced === false ? (
                          <span className="ml-1.5 inline-block text-[8px] bg-amber-500 text-black px-1 py-0.5 rounded-sm uppercase font-mono tracking-widest font-black leading-none drop-shadow-md align-middle">[ ▰ OFFLINE CACHED ]</span>
                        ) : item.is_synced === true ? (
                          <span className="ml-1.5 inline-block text-[8px] bg-[#00ffcc] text-black px-1 py-0.5 rounded-sm uppercase font-mono tracking-widest font-black leading-none drop-shadow-md align-middle shadow-[0_0_10px_rgba(0,255,204,0.3)]">[ ✓ SYNCED ]</span>
                        ) : null}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">{item.item_type}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/60">
                      <span className="text-[10px] text-zinc-500 font-mono text-left block">
                        Table Stock: <span className="text-white font-bold">{item.table_stock}</span> <br/>
                        Van Stock: <span className="text-zinc-300 font-bold">{item.van_stock}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTransferModal?.(item.id);
                        }}
                        className="w-full py-1.5 px-2 bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-mono font-black uppercase rounded-lg transition-all text-center block cursor-pointer select-none"
                      >
                        Add item to merch table
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyToMerchShop(item, e)}
                        className="w-full py-1.5 px-2 bg-zinc-900/80 hover:bg-[#39ff14]/10 border border-zinc-850 hover:border-[#39ff14]/30 text-[#39ff14] text-[8.5px] font-mono font-black uppercase rounded-lg transition-all text-center block cursor-pointer select-none"
                      >
                        🚀 Copy to Merch Shop
                      </button>
                    </div>
                  </div>
                </div>
              );   })}
          </div>
        ) : (
          /* LIST VIEW - DETAILED COMPACT ROWS */
          <div className="space-y-2">
            {filteredAndSortedInventory.map((item, idx) => {
              // Custom status color badge
              let healthBadgeStyle = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
              if (item.status === 'Warning') healthBadgeStyle = 'border-amber-500/30 text-amber-400 bg-amber-500/5';
              if (item.status === 'Critical') healthBadgeStyle = 'border-red-500/30 text-red-400 bg-red-500/5';

              const isWarningActive = statusFilter === 'Warning' && item.status === 'Warning';
              const isCriticalActive = statusFilter === 'Critical' && item.status === 'Critical';
              const isHighlighted = isWarningActive || isCriticalActive;

              return (
                <div 
                  key={`${item.id}-${idx}`}
                  onClick={() => onEditItem?.(item)}
                  className={`bg-[#13161d] border rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer ${
                    isHighlighted 
                    ? 'ring-2 ring-offset-2 ring-offset-black animate-pulse' 
                    : 'border-[#252830] hover:border-zinc-700/80'
                  }`}
                  style={{
                    borderColor: isHighlighted
                      ? (item.status === 'Warning' ? '#f59e0b' : '#ef4444')
                      : undefined,
                    boxShadow: isHighlighted
                      ? `0 0 20px ${item.status === 'Warning' ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`
                      : undefined
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-800">
                      <img 
                        src={resolveInventoryImageUrl(item)} 
                        alt={item?.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover shrink-0 mix-blend-color-dodge opacity-80"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white truncate leading-tight font-sans tracking-tight">
                        {item?.name}
                        {item.is_synced === false ? (
                          <span className="ml-2 inline-block text-[8px] bg-amber-500 text-black px-1 py-0.5 rounded-sm uppercase font-mono tracking-widest font-black leading-none drop-shadow-md align-middle">[ ▰ OFFLINE CACHED ]</span>
                        ) : item.is_synced === true ? (
                          <span className="ml-2 inline-block text-[8px] bg-[#00ffcc] text-black px-1 py-0.5 rounded-sm uppercase font-mono tracking-widest font-black leading-none drop-shadow-md align-middle shadow-[0_0_10px_rgba(0,255,204,0.3)]">[ ✓ SYNCED ]</span>
                        ) : null}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded uppercase leading-none">{item.item_type}</span>
                        <span className="text-xs font-mono font-bold text-[#00ffcc]">${(item.price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-2">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${healthBadgeStyle}`}>
                      {item.status}
                    </span>

                    <div className="flex flex-col items-end border border-zinc-800 rounded p-1.5 bg-zinc-950/40 min-w-[110px]">
                      <span className="text-[10px] font-mono font-bold text-white pb-0.5 leading-none text-right">
                        Table Stock: {item.table_stock}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 leading-none text-right mt-1">
                        Van Stock: {item.van_stock}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTransferModal?.(item.id);
                        }}
                        className="py-1 px-2.5 bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-mono font-black uppercase rounded-lg transition-all cursor-pointer select-none text-center"
                      >
                        Add item to merch table
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyToMerchShop(item, e)}
                        className="py-1 px-2.5 bg-zinc-900 hover:bg-[#39ff14]/15 border border-zinc-850 hover:border-[#39ff14]/40 text-[#39ff14] text-[8.5px] font-mono font-black uppercase rounded-lg transition-all cursor-pointer select-none text-center"
                      >
                        🚀 Copy to Shop
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. PRINTERS CATALOGUE & PRODUCTION REORDERS CENTER OVERLAY */}
      <AnimatePresence>
        {isPrintersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#12141c] border-2 border-[#00ffcc] w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[88vh] shadow-[0_0_50px_rgba(0,255,204,0.15)]">
              {/* Modal Header */}
              <div className="bg-[#161a25] border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Printer className="w-5 h-5 text-[#00ffcc]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Community Production Printers</h3>
                      {printersSyncStatus === 'connecting' && (
                        <span className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black tracking-widest uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          SYNCING
                        </span>
                      )}
                      {printersSyncStatus === 'connected' && (
                        <span className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black tracking-widest uppercase" title="All operations sync network-wide instantly">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          LIVE NETWORK
                        </span>
                      )}
                      {printersSyncStatus === 'local_resilience' && (
                        <span className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.2 rounded bg-zinc-500/15 text-zinc-400 border border-zinc-800 font-semibold uppercase" title="Offline or table not deployed in Supabase. Locally persistent.">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                          LOCAL ONLY
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono">Trusted community recommendations & price diagnostics</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPrintersModalOpen(false);
                    setShowAddPrinterForm(false);
                  }}
                  className="text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-[250px] scrollbar-none">
                {/* 10% or less alert notification bar in catalogue */}
                {inventory.filter(isLow10Percent).length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4 text-red-00 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Low Stock Alert ({inventory.filter(isLow10Percent).length} items need print run)</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono">The following items are running at 10% or less capacity. Tap any to design an immediate reorder draft:</p>
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                      {inventory.filter(isLow10Percent).map((item, idx) => {
                        const totalSec = (item.table_stock || 0) + (item.van_stock || 0);
                        return (
                          <div key={`${item.id}-${idx}`} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-zinc-800 hover:border-red-500/50 transition-colors">
                            <span className="text-[10px] text-white truncate max-w-[180px] font-sans font-semibold">{item?.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-zinc-500">Left: {totalSec}/{item.initial_batch_size || 100}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsPrintersModalOpen(false);
                                  handleTriggerReorder(item);
                                }}
                                className="bg-red-500 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase hover:bg-red-600 transition-colors cursor-pointer"
                              >
                                Draft →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* COMMUNITY DB CONTROL FILTERS BAR */}
                <div className="bg-[#181c25] border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <span className="text-[9.5px] font-mono uppercase tracking-widest text-[#00ffcc] font-bold block">Community Search Filters</span>
                  
                  {/* Text search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Search by name, region or specialties..."
                      value={printerSearchQuery}
                      onChange={(e) => setPrinterSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-[#00ffcc]"
                    />
                  </div>

                  {/* Specialty and Price Filters */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[8.5px] font-mono text-zinc-400 uppercase">Specialty Type</label>
                      <select
                        value={printerSpecialtyFilter}
                        onChange={(e) => setPrinterSpecialtyFilter(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-[10.51px] font-mono text-zinc-300 rounded p-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Specialties</option>
                        <option value="Screenprint">Screenprint / Tees</option>
                        <option value="CD/Vinyl">CD & Vinyl Duplication</option>
                        <option value="Stickers">Stickers (Holographic)</option>
                        <option value="Patches">Patches / Enamel Pins</option>
                        <option value="Embroidery">Embroidery & Stitch</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[8.5px] font-mono text-zinc-400 uppercase">Price Range</label>
                      <select
                        value={printerPriceFilter}
                        onChange={(e) => setPrinterPriceFilter(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-[10.51px] font-mono text-zinc-300 rounded p-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Price Ranges</option>
                        <option value="budget">$ Budget Source</option>
                        <option value="moderate">$$ Moderate Rates</option>
                        <option value="premium">$$$$ Premium Boutique</option>
                      </select>
                    </div>
                  </div>

                  {/* Blacklist filter tabs row */}
                  <div className="flex gap-1.5 p-1 bg-zinc-950/60 rounded-lg border border-zinc-900 select-none">
                    <button
                      type="button"
                      onClick={() => setPrinterViewMode('active')}
                      className={`flex-1 font-mono text-[9px] py-1 rounded-md transition-all font-bold ${
                        printerViewMode === 'active' 
                          ? 'bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30 shadow-[0_0_8px_rgba(0,255,204,0.15)]' 
                          : 'text-zinc-500 hover:text-white border border-transparent'
                      }`}
                    >
                      Active Pool ({printers.filter(p => !p.blacklisted).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinterViewMode('blacklisted')}
                      className={`flex-1 font-mono text-[9px] py-1 rounded-md transition-all font-bold ${
                        printerViewMode === 'blacklisted' 
                          ? 'bg-red-500/15 text-red-500 border border-red-500/30' 
                          : 'text-zinc-500 hover:text-white border border-transparent'
                      }`}
                    >
                      🚫 Blacklisted ({printers.filter(p => !!p.blacklisted).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinterViewMode('all')}
                      className={`flex-1 font-mono text-[9px] py-1 rounded-md transition-all font-bold ${
                        printerViewMode === 'all' 
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                          : 'text-zinc-500 hover:text-white border border-transparent'
                      }`}
                    >
                      Show All ({printers.length})
                    </button>
                  </div>

                  {/* Sort Mode selection */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-950/60 text-left">
                    <span className="text-[9px] text-zinc-500 font-mono">Found {filteredPrinters.length} verified printers</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8.5px] font-mono text-zinc-400 uppercase">Sort by:</span>
                      <select
                        value={printerSortBy}
                        onChange={(e) => setPrinterSortBy(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-[#00ffcc] rounded p-1 focus:outline-none cursor-pointer"
                      >
                        <option value="rating">Stars Rating ★</option>
                        <option value="likes">Tour Recommendations Thumbs</option>
                        <option value="name">Supplier Name A-Z</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Trusted Printers Source ({filteredPrinters.length})</span>
                  <button
                    type="button"
                    onClick={() => setShowAddPrinterForm(!showAddPrinterForm)}
                    className="bg-[#00ffcc] text-black font-mono font-bold text-[10px] px-3 py-1.5 rounded uppercase hover:bg-[#00ffcc]/80 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showAddPrinterForm ? 'Close Form' : 'Recommend a Shop'}
                  </button>
                </div>

                {/* Inline Add Printer Form */}
                {showAddPrinterForm && (
                  <form onSubmit={handleAddPrinter} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-3.5 text-left">
                    <h4 className="text-xs font-mono font-bold text-[#00ffcc] uppercase tracking-wide text-left">Introduce Verified Printer to Community</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Rep/Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={newPrinter.name}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. John Doe / Representative"
                          className="w-full bg-[#161821] border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={newPrinter.company_name}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, company_name: e.target.value }))}
                          placeholder="e.g. Inked Press"
                          className="w-full bg-[#161821] border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={newPrinter.email}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="orders@inkedpress.com"
                          className="w-full bg-[#161821] border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={newPrinter.phone}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="e.g. +1-555-0199"
                          className="w-full bg-[#161821] border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">Price tier</label>
                        <select
                          value={newPrinter.price_range}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, price_range: e.target.value }))}
                          className="w-full bg-[#161821] border border-zinc-800 rounded p-1.5 text-[11px] font-mono text-zinc-300 focus:outline-none"
                        >
                          <option value="budget">$ (Budget)</option>
                          <option value="moderate">$$ (Moderate)</option>
                          <option value="premium">$$$ (Premium)</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">Shop Rating</label>
                        <select
                          value={newPrinter.rating}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, rating: e.target.value }))}
                          className="w-full bg-[#161821] border border-zinc-800 rounded p-1.5 text-[11px] font-mono text-zinc-300 focus:outline-none"
                        >
                          <option value="5.0">5.0 ★ Highly Recommended</option>
                          <option value="4.5">4.5 ★ Great Choice</option>
                          <option value="4.0">4.0 ★ Reliable Supplier</option>
                          <option value="3.5">3.5 ★ Standard Service</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">Region / City</label>
                        <input
                          type="text"
                          value={newPrinter.region}
                          onChange={(e) => setNewPrinter(prev => ({ ...prev, region: e.target.value }))}
                          placeholder="e.g. Chicago, IL"
                          className="w-full bg-[#161821] border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase">Specialties (comma separated)</label>
                      <input
                        type="text"
                        value={newPrinter.specialties}
                        onChange={(e) => setNewPrinter(prev => ({ ...prev, specialties: e.target.value }))}
                        placeholder="Tees, Hoodies, Flat Flags, Posters"
                        className="w-full bg-[#161821] border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold text-left block">Shop Specialties / Description</label>
                      <textarea
                        value={newPrinter.notes}
                        onChange={(e) => setNewPrinter(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Why is this printer recommended? Heavy vinyl weight, custom neck labels, fast coast-to-coast shipping etc."
                        rows={2}
                        className="w-full bg-[#161821] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#00ffcc] text-black font-mono font-black text-xs py-2 rounded-xl uppercase hover:bg-emerald-400 cursor-pointer text-center"
                    >
                      Publish to Community Pool ✓
                    </button>
                  </form>
                )}

                {/* Printer Cards List */}
                <div className="space-y-4">
                  {filteredPrinters.length === 0 ? (
                    <div className="text-center py-8 bg-zinc-950/20 rounded-xl border border-dashed border-zinc-800">
                      <p className="text-xs text-zinc-500 font-mono">No matching suppliers found. Try adjusting the filter or search tags.</p>
                    </div>
                  ) : (
                    filteredPrinters.map((printer, idx) => {
                      const isExpanded = expandedPrinterId === printer.id;
                      
                      return (
                        <div 
                          key={`${printer.id}-${idx}`} 
                          className={`relative text-left transition-all p-4.5 space-y-3.5 rounded-xl border ${
                            printer.blacklisted 
                              ? 'bg-red-950/15 border-red-900/40 hover:border-red-800/60 shadow-[inset_0_0_12px_rgba(239,68,68,0.05)] opacity-90' 
                              : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/10'
                          }`}
                        >
                          {/* Trash button for created custom suppliers */}
                          {printer.id.startsWith('printer_') && (
                            <button
                              type="button"
                              onClick={() => handleDeletePrinter(printer.id)}
                              className="absolute top-4.5 right-4 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                              title="Remove custom recommendation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Top Header Card Info */}
                          <div className="flex justify-between items-start pr-6 select-none">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className={`text-xs font-bold font-mono ${printer.blacklisted ? 'text-red-300 line-through' : 'text-white'}`}>
                                  {printer.company_name || printer.name}
                                </h4>
                                {printer.price_range && (
                                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                                    printer.blacklisted 
                                      ? 'bg-red-950 text-red-400 border border-red-900/30' 
                                      : 'bg-[#00ffcc]/10 text-[#00ffcc]'
                                  }`} title={`${printer.price_range} price index`}>
                                    {printer.price_range === 'budget' ? '$ Budget' : printer.price_range === 'premium' ? '$$$ Premium' : '$$ Mid'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-400 font-sans mt-0.5 uppercase tracking-wide flex items-center gap-1">
                                <span className={printer.blacklisted ? 'text-zinc-600' : ''}>Point of contact: {printer.name}</span>
                                {printer.region && (
                                  <span className="text-zinc-500 font-mono text-[9.51px] flex items-center gap-0.5 normal-case border-l border-zinc-800 pl-1.5">
                                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                    {printer.region}
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Rating and Upvote box */}
                            <div className="flex flex-col items-end shrink-0 select-none">
                              <div className="flex items-center gap-1 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800/60">
                                <Star className={`w-3 h-3 ${printer.blacklisted ? 'text-zinc-600 fill-zinc-600' : 'text-yellow-400 fill-yellow-400'}`} />
                                <span className={`text-[10.51px] font-mono font-bold ${printer.blacklisted ? 'text-zinc-500' : 'text-yellow-400'}`}>{printer.rating ? printer.rating.toFixed(1) : '5.0'}</span>
                              </div>
                              {!printer.blacklisted && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleLikePrinter(printer.id)}
                                  className={`flex items-center gap-1 mt-1 text-[9.51px] font-mono px-1.5 py-0.5 rounded transition-colors border ${
                                    printer.liked_by_user 
                                      ? 'bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc]' 
                                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-500 hover:text-white hover:border-zinc-700'
                                  }`}
                                  title="Upvote recommendation for this shop"
                                >
                                  {printer.liked_by_user ? <Heart className="w-2.5 h-2.5 text-[#00ffcc] fill-[#00ffcc]" /> : <ThumbsUp className="w-2.5 h-2.5" />}
                                  <span>Recommend ({printer.likes || 0})</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Specialties badge lists */}
                          {printer.specialties && printer.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {printer.specialties.map((spec: string, idx) => (
                                <span key={`${spec}-${idx}`} className={`border text-[8.51px] font-mono rounded px-1.5 py-0.5 font-bold uppercase tracking-wider ${
                                  printer.blacklisted 
                                    ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600' 
                                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
                                }`}>
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Notes/Specialty remarks */}
                          {printer.notes && (
                            <p className={`text-[10px] leading-relaxed italic p-2 rounded font-mono border ${
                              printer.blacklisted 
                                ? 'text-zinc-500 bg-black/10 border-red-950/20' 
                                : 'text-zinc-400 bg-black/15 border-zinc-900/60'
                            }`}>
                              "{printer.notes}"
                            </p>
                          )}

                          {/* Blacklisted Alert Banner */}
                          {printer.blacklisted && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-left space-y-1">
                              <div className="flex items-center gap-1.5 font-bold font-mono text-[9px] uppercase tracking-wider text-red-500">
                                <Ban className="w-3.5 h-3.5 animate-pulse" />
                                <span>🚫 BLACKLISTED SUPPLIER</span>
                              </div>
                              <p className="text-[10.5px] font-mono text-red-400 leading-relaxed pl-5 italic">
                                "{printer.blacklist_reason || 'Pre-emptively blacklisted by tour manager.'}"
                              </p>
                            </div>
                          )}

                          {/* Communications drawer link utilities */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-900/80">
                            {/* Comm channels */}
                            <div className="flex flex-wrap gap-1.5 text-left">
                              {!printer.blacklisted ? (
                                <>
                                  <a
                                    href={`mailto:${printer.email}`}
                                    className="bg-zinc-900/80 hover:bg-[#131d27] text-zinc-300 hover:text-[#00ffcc] border border-zinc-800/60 hover:border-[#00ffcc]/40 py-1 px-2.5 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all shrink-0"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-[#00ffcc]" />
                                    <span>{printer.email}</span>
                                  </a>

                                  {printer.phone && (
                                    <a
                                      href={`tel:${printer.phone}`}
                                      className="bg-zinc-900/80 hover:bg-[#131d27] text-zinc-300 hover:text-amber-400 border border-zinc-800/60 hover:border-amber-400/40 py-1 px-2.5 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all shrink-0"
                                    >
                                      <Phone className="w-3.5 h-3.5 text-amber-500" />
                                      <span>{printer.phone}</span>
                                    </a>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] font-mono text-red-500/80 flex items-center gap-1 font-bold">
                                  🚫 Communications Blocked
                                </span>
                              )}
                            </div>

                            {/* Actions Group (Reviews & Blacklist Control) */}
                            <div className="flex items-center gap-2">
                              {!printer.blacklisted ? (
                                <>
                                  {/* BLACKLIST TOGGLE */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBlacklistingId(blacklistingId === printer.id ? null : printer.id);
                                      setBlacklistNotes('');
                                    }}
                                    className={`text-[10px] font-mono font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer border ${
                                      blacklistingId === printer.id 
                                        ? 'bg-red-500 text-white border-red-500' 
                                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-950'
                                    }`}
                                    title="Add to Blacklist"
                                  >
                                    <Ban className="w-3 h-3" />
                                    <span>Blacklist</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setExpandedPrinterId(isExpanded ? null : printer.id)}
                                    className="text-[10.51px] font-mono font-bold text-[#00ffcc] hover:underline flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-zinc-900"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Feedback ({printer.reviews?.length || 0})</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUnblacklistPrinter(printer.id)}
                                  className="bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-mono font-bold py-1 px-2.5 rounded transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Ban className="w-3 h-3 rotate-180" />
                                  <span>Unblacklist Shop</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* INLINE BLACKLIST NOTE SUBMISSION BUILDER */}
                          {blacklistingId === printer.id && (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleBlacklistPrinter(printer.id, blacklistNotes);
                              }}
                              className="bg-red-950/20 p-3.5 rounded-xl border border-red-900/40 space-y-2.5 mt-2.5 animate-slide-down text-left"
                            >
                              <span className="text-[9px] font-mono uppercase tracking-widest text-red-500 block font-bold">
                                Reason for Blacklisting
                              </span>
                              <textarea 
                                required
                                rows={2}
                                placeholder="Why is this supplier blacklisted? (e.g., missed ship dates, poor print resolution, ink wash-out, uncooperative rep)"
                                value={blacklistNotes}
                                onChange={(e) => setBlacklistNotes(e.target.value)}
                                className="w-full bg-black/60 border border-red-900/30 rounded p-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-red-500 resize-none font-mono"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setBlacklistingId(null)}
                                  className="bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[9px] px-2.5 py-1 rounded cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="bg-red-600 hover:bg-red-500 text-white font-mono text-[9px] px-3 py-1 rounded uppercase font-black cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                                >
                                  Confirm Blacklist 🚫
                                </button>
                              </div>
                            </form>
                          )}

                          {/* EXPANDED FEEDBACK REVIEWS SECTION */}
                          {isExpanded && (
                            <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/60 space-y-3.5 animate-slide-down">
                              <h5 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-black border-b border-zinc-900 pb-1 flex items-center gap-1">
                                Verification Comments & Reviews
                              </h5>

                              {/* Review Items */}
                              {(!printer.reviews || printer.reviews.length === 0) ? (
                                <p className="text-[9.5px] font-mono text-zinc-500 italic text-center py-2">No verification comments written. Be the first tour to rate them!</p>
                              ) : (
                                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1 scrollbar-none">
                                  {printer.reviews.map((rev: any, index: number) => (
                                    <div key={`inv-sec-${index}`} className="bg-black/40 border border-zinc-900 p-2.5 rounded-lg space-y-1">
                                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                                        <span className="font-bold text-white">{rev.name}</span>
                                        <span>{rev.date}</span>
                                      </div>
                                      <div className="flex items-center gap-1 select-none">
                                        {Array.from({ length: 5 }).map((_, sIdx) => (
                                          <Star 
                                            key={`inv-sku-row-${sIdx}`} 
                                            className={`w-2.5 h-2.5 ${sIdx < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} 
                                          />
                                        ))}
                                      </div>
                                      <p className="text-[10px] text-zinc-300 font-mono mt-0.5 leading-relaxed">
                                        "{rev.text}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ADD A COMMUNITY REVIEW FORM */}
                              <form onSubmit={(e) => handleAddReview(e, printer.id)} className="pt-2 border-t border-zinc-900 space-y-2">
                                <span className="text-[9px] font-mono uppercase tracking-widest text-[#00ffcc] block font-bold">Write a Verification Review</span>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <input 
                                    type="text"
                                    required
                                    placeholder="Your Name (e.g. Sarah Mgr)"
                                    value={newReviewForm.name}
                                    onChange={(e) => setNewReviewForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="bg-black/40 border border-zinc-800 rounded p-1.5 text-[10.5px] text-white focus:outline-none placeholder-zinc-600 font-mono"
                                  />

                                  <select
                                    value={newReviewForm.rating}
                                    onChange={(e) => setNewReviewForm(prev => ({ ...prev, rating: parseInt(e.target.value, 10) }))}
                                    className="bg-[#12141c] border border-zinc-800 text-[10.51px] font-mono text-[#00ffcc] rounded p-1.5 focus:outline-none cursor-pointer"
                                  >
                                    <option value="5">⭐⭐⭐⭐⭐ 5/5 Stars</option>
                                    <option value="4">⭐⭐⭐⭐ 4/5 Stars</option>
                                    <option value="3">⭐⭐⭐ 3/5 Stars</option>
                                    <option value="2">⭐⭐ 2/5 Stars</option>
                                    <option value="1">⭐ 1/5 Stars</option>
                                  </select>
                                </div>

                                <textarea 
                                  required
                                  rows={2}
                                  placeholder="Write about print quality, garment feel, pricing or quick dispatch..."
                                  value={newReviewForm.text}
                                  onChange={(e) => setNewReviewForm(prev => ({ ...prev, text: e.target.value }))}
                                  className="w-full bg-black/40 border border-zinc-800 rounded p-2 text-[10.5px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#00ffcc] resize-none font-mono"
                                />

                                <button
                                  type="submit"
                                  className="w-full bg-[#00ffcc]/15 border border-[#00ffcc]/30 hover:bg-[#00ffcc] hover:text-black text-[#00ffcc] text-[9.5px] font-mono font-black py-1 px-3 rounded uppercase tracking-wider transition-all text-center cursor-pointer"
                                >
                                  Submit Review & Re-calculate Rating
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-[#161a25] border-t border-zinc-800 px-5 py-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPrintersModalOpen(false)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono text-[10px] uppercase font-bold py-1.5 px-4 rounded-xl border border-zinc-800 cursor-pointer"
                >
                  Close Database Panel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. URGENT RE-ORDER PLACEMENT WIZARD & EMAIL AUTO-DRAFT MODAL */}
      <AnimatePresence>
        {reorderItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0e1017] border-2 border-red-500/80 w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              
              {/* Header */}
              <div className="bg-red-950/30 border-b border-red-900/40 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 animate-pulse animate-pulse" />
                  <div>
                    <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider text-left">Configure Batch Re-Order Run</h3>
                    <p className="text-[9.5px] text-zinc-400 font-mono text-left">Formulate requisition package for: {reorderItem.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReorderItem(null);
                    setSelectedPrinterForReorder(null);
                  }}
                  className="text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg p-1 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-left">
                {/* Visual statistics */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-900">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Current stock count</span>
                    <span className="text-sm font-bold text-red-400 font-mono">{reorderItem.table_stock + reorderItem.van_stock} pcs left</span>
                  </div>
                  <div className="space-y-1 border-l border-zinc-900 pl-3 text-left">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Capacity Limit</span>
                    <span className="text-sm font-semibold text-zinc-400 font-mono">10% of {reorderItem.initial_batch_size || 100} run</span>
                  </div>
                </div>

                {/* Printer selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold text-left block">Select Merchandise Printer Supplier</label>
                  {printers.length === 0 ? (
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 text-center space-y-2">
                      <p className="text-[10px] font-mono text-zinc-500">No custom printers configured. Register your first supplier contact.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setReorderItem(null);
                          setIsPrintersModalOpen(true);
                          setShowAddPrinterForm(true);
                        }}
                        className="bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30 py-1 px-3 rounded text-[9.5px] font-mono uppercase font-black tracking-wider hover:bg-[#00ffcc]/30 cursor-pointer"
                      >
                        Setup Printers Now
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedPrinterForReorder ? selectedPrinterForReorder.id : ''}
                      onChange={(e) => {
                        const ptr = printers.find(p => p.id === e.target.value);
                        setSelectedPrinterForReorder(ptr);
                        if (ptr) {
                          setReorderDraftNotes(`Hi! We are running low on the "${reorderItem.name}" standard apparel item. We currently only have ${reorderItem.table_stock + reorderItem.van_stock} units left. We want to place an urgent order of ${reorderQuantity} units. Let us know the estimate. Cheers!`);
                        }
                      }}
                      className="w-full bg-[#161821] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00ffcc] cursor-pointer"
                    >
                      {printers.map((p, pIdx) => (
                        <option key={`${p.id}-${pIdx}`} value={p.id}>{p.name} {p.company_name ? `(${p.company_name})` : ''}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Reorder volume */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Reorder Volume</label>
                    <span className="text-xs text-[#00ffcc] font-mono font-bold animate-pulse">{reorderQuantity} units</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="500"
                    step="25"
                    value={reorderQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setReorderQuantity(val);
                      setReorderDraftNotes(`Hi! We are running low on the "${reorderItem.name}" standard apparel item. We currently only have ${reorderItem.table_stock + reorderItem.van_stock} units left. We want to place an urgent order of ${val} units. Let us know the estimate. Cheers!`);
                    }}
                    className="w-full h-1 bg-zinc-800 accent-[#00ffcc] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Message preview details */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold text-left block">Live Order Message Preview</label>
                  <textarea
                    value={reorderDraftNotes}
                    onChange={(e) => setReorderDraftNotes(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0d0f15] border border-zinc-800 rounded-lg p-2.5 text-[11px] font-mono text-zinc-300 leading-normal focus:outline-none resize-none focus:border-red-500"
                  />
                </div>

                {/* Action controls */}
                {selectedPrinterForReorder && (
                  <div className="space-y-2 pt-2 border-t border-zinc-900 text-left">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`mailto:${selectedPrinterForReorder.email}?subject=${encodeURIComponent(`Urgent Re-order Request: ${reorderItem.name}`)}&body=${encodeURIComponent(reorderDraftNotes)}`}
                        onClick={() => {
                          triggerNotification('Email client launched with draft order template.');
                          addLog(`Launched email dispatcher to reorder ${reorderQuantity}x "${reorderItem.name}" from ${selectedPrinterForReorder.name}.`);
                          setReorderItem(null);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-[10.51px] py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-md shadow-emerald-500/10 shrink-0"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Send Email</span>
                      </a>

                      {selectedPrinterForReorder.phone ? (
                        <a
                          href={`tel:${selectedPrinterForReorder.phone}`}
                          onClick={() => {
                            triggerNotification('Device phone receiver activated.');
                            addLog(`Launched phone telecommunication draft to call ${selectedPrinterForReorder.name}.`);
                            setReorderItem(null);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-[10.51px] py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-md shadow-amber-500/10 shrink-0"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call Shop</span>
                        </a>
                      ) : (
                        <div className="bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[9px] rounded-xl flex items-center justify-center leading-tight p-2 text-center">
                          No phone number on supplier profile
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[9px] text-zinc-500 text-center font-mono italic">
                      *Tapping opens system mailer or logs phone communication directly.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#12141a] border-t border-zinc-900 px-5 py-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReorderItem(null);
                    setSelectedPrinterForReorder(null);
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono text-[10px] uppercase font-bold py-1.5 px-4 rounded-xl border border-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
