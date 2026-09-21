import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Copy,
  Trash2,
  Save,
  CheckCircle2,
  ListPlus,
  Plus,
  List,
  Grid,
  Star,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem } from '../../../types';
import { generateUUID, uploadInventoryItemImage, resolveInventoryImageUrl, INVENTORY_STORAGE_BUCKET } from '../../../supabase';

interface AddItemViewProps {
  onBack: () => void;
  onSave: (item: Partial<InventoryItem>, forceOffline?: boolean) => Promise<boolean | void>;
  onDelete?: (itemId: string) => void;
  triggerNotification: (msg: string) => void;
  initialItem?: InventoryItem;
  isOffline?: boolean;
}

export default function AddItemView({ onBack, onSave, onDelete, triggerNotification, initialItem, isOffline = false }: AddItemViewProps) {
  const initialResolvedImage = initialItem ? resolveInventoryImageUrl(initialItem) : null;
  const [photoCount, setPhotoCount] = useState(initialResolvedImage ? 1 : 0);
  const [itemPhotoUrl, setItemPhotoUrl] = useState<string | null>(initialResolvedImage);
  const [itemImagePath, setItemImagePath] = useState<string | null>(initialItem?.image_path || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [itemName, setItemName] = useState(initialItem?.name || '');
  const [category, setCategory] = useState(initialItem?.item_type || 'APPAREL');
  const [retailPrice, setRetailPrice] = useState(initialItem?.price ? String(initialItem.price) : '');
  const [unitCost, setUnitCost] = useState(initialItem?.cost ? String(initialItem.cost) : '');
  const [sku, setSku] = useState(initialItem?.sku || '');
  const [initialBatchSize, setInitialBatchSize] = useState<number>(initialItem?.initial_batch_size || 100);

  const [rlsErrorMsg, setRlsErrorMsg] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<Partial<InventoryItem> | null>(null);

  // Dynamically calculate category prices based on existing items in database
  const [similarItemsStats, setSimilarItemsStats] = useState<{ min: number; avg: number; max: number } | null>(null);

  React.useEffect(() => {
    try {
      const savedBandId = localStorage.getItem('nexus_core_active_band_id') || '';
      const savedProfileStr = localStorage.getItem('nexus_core_user_profile');
      let savedProfileId = 'profile_admin';
      if (savedProfileStr) {
        try {
          const parsed = JSON.parse(savedProfileStr);
          if (parsed && parsed.id) savedProfileId = parsed.id;
        } catch (_) {}
      }
      const suffix = savedBandId || savedProfileId || 'offline';
      const saved = localStorage.getItem(`nexus_core_${suffix}_inventory_offline`);
      if (saved) {
        const items: any[] = JSON.parse(saved);
        const filtered = items.filter(item => item && item.item_type === category && item.price > 0 && item.id !== initialItem?.id);
        if (filtered.length > 0) {
          const prices = filtered.map(item => item.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const sum = prices.reduce((a, b) => a + b, 0);
          const avg = Math.round((sum / prices.length) * 10) / 10;
          setSimilarItemsStats({ min, avg, max });
        } else {
          setSimilarItemsStats(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [category, initialItem?.id]);

  const applyStandardPresets = () => {
    const standardSizes = ['Small', 'Medium', 'Large', 'XL', '2XL', '3XL'];
    const newVariants = standardSizes.map((size, index) => ({
      id: `preset_${index}_${Date.now()}`,
      size,
      stock: ''
    }));
    setVariants(newVariants);
    triggerNotification('Standard presets applied (Small, Medium, Large, XL, 2XL, 3XL)!');
  };

  const generateRandomSku = () => {
    const prefixes: Record<string, string> = {
      'APPAREL': 'AP',
      'MUSIC': 'MU',
      'ACCESSORIES': 'AC',
      'POSTERS': 'PO'
    };
    const prefix = prefixes[category] || 'IT';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randChar = chars[Math.floor(Math.random() * chars.length)];
    const generated = `${prefix}`;
    setSku(generated);
    triggerNotification(`Generated SKU: ${generated}`);
  };


  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUploadClick = () => {
    if (photoCount < 3) {
      fileInputRef.current?.click();
    }
  };

  const processAndUploadFile = async (file: File) => {
    // Setup immediate local blob for rapid visual preview
    const previewUrl = URL.createObjectURL(file);
    setItemPhotoUrl(previewUrl);
    setPhotoCount(prev => Math.min(3, prev + 1));
    setIsUploadingImage(true);
    triggerNotification(`Routing upload to '${INVENTORY_STORAGE_BUCKET}' storage bucket...`);

    try {
      const activeBandId = initialItem?.band_id || localStorage.getItem('nexus_core_active_band_id') || '';
      const result = await uploadInventoryItemImage(file, initialItem?.id || generateUUID(), activeBandId);

      if (result && result.publicUrl) {
        setItemPhotoUrl(result.publicUrl);
        setItemImagePath(result.imagePath);
        triggerNotification(`Photo uploaded to Supabase '${INVENTORY_STORAGE_BUCKET}'!`);
      }
    } catch (err: any) {
      console.warn(`[AddItemView] Storage upload fallback:`, err);
      // Fallback to local compressed WebP base64
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.7);
          setItemPhotoUrl(dataUrl);
        }
      };
      img.src = previewUrl;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processAndUploadFile(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processAndUploadFile(file);
      } else {
        triggerNotification('Please drop a valid image file');
      }
    }
  };

  // Accoridon States
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showProductPhotos, setShowProductPhotos] = useState(true);
  const [showPricing, setShowPricing] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStorefrontSettings, setShowStorefrontSettings] = useState(false);

  // Shipping States
  const [unitWeight, setUnitWeight] = useState(initialItem?.unit_weight || '');
  const [packageType, setPackageType] = useState(initialItem?.package_type || 'Standard Polybag');

  // Derived Pricing Calculations
  const retail = parseFloat(retailPrice) || 0;
  const cost = parseFloat(unitCost) || 0;
  const showMargin = retail > 0 && cost > 0;
  const profit = retail - cost;
  const profitMarginPercent = retail > 0 ? Math.round((profit / retail) * 100) : 0;

  // Sizes & Variants
  const [variants, setVariants] = useState<{id: string, size: string, stock: string}[]>(() => {
    if (initialItem?.variants && initialItem.variants.length > 0) {
      return initialItem.variants;
    }
    return [{ id: '1', size: 'Medium', stock: initialItem?.van_stock !== undefined ? String(initialItem.van_stock) : '' }];
  });
  const [lowStockAlert, setLowStockAlert] = useState(initialItem?.low_threshold || 10);
  const [criticalStockAlert, setCriticalStockAlert] = useState(3);

  // Tags
  const availableTags = [
    { label: 'Featured', color: 'text-purple-400', bg: 'bg-purple-900/40', border: 'border-purple-600/50' },
    { label: 'Best Seller', color: 'text-emerald-400', bg: 'bg-emerald-900/40', border: 'border-emerald-600/50' },
    { label: 'Limited Edition', color: 'text-amber-400', bg: 'bg-amber-900/40', border: 'border-amber-600/50' },
    { label: 'New', color: 'text-teal-400', bg: 'bg-teal-900/40', border: 'border-teal-600/50' },
    { label: 'Seasonal', color: 'text-cyan-400', bg: 'bg-cyan-900/40', border: 'border-cyan-600/50' },
    { label: 'Exclusive', color: 'text-pink-400', bg: 'bg-pink-900/40', border: 'border-pink-600/50' }
  ];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const totalStartingStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

  const [isStorefrontActive, setIsStorefrontActive] = useState<boolean>(initialItem ? ((initialItem as any)?.isStorefrontActive || false) : true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!itemName) {
      triggerNotification('Item name is required');
      return;
    }
    
    setIsSaving(true);
    const newItem: Partial<InventoryItem> = {
      ...initialItem,
      id: initialItem?.id || generateUUID(),
      name: itemName,
      price: parseFloat(retailPrice) || 0,
      item_type: category,
      table_stock: initialItem ? initialItem.table_stock : 0, // Preserve for edit, default to 0 for new
      van_stock: totalStartingStock, // Input represents overall van stock
      low_threshold: lowStockAlert,
      initial_batch_size: initialBatchSize,
      status: totalStartingStock > lowStockAlert ? 'Healthy' : totalStartingStock > criticalStockAlert ? 'Warning' : 'Critical',
      border_color: initialItem?.border_color || '#00ffcc', // Default new item color
      image_url: itemPhotoUrl || initialItem?.image_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
      image_path: itemImagePath || initialItem?.image_path || undefined,
      cost: parseFloat(unitCost) || undefined,
      sku: sku || undefined,
      unit_weight: unitWeight || undefined,
      package_type: packageType || undefined,
      variants,
      isStorefrontActive
    } as any;

    try {
      const success = await onSave(newItem);
      if (success !== false) {
        triggerNotification('Item saved successfully');
        onBack();
      } else {
        alert("Failed to save to database. Please check connection.");
      }
    } catch (e: any) {
      const errorStr = String(e.message || e.description || JSON.stringify(e) || e);
      if (
        errorStr.toLowerCase().includes('row-level security') ||
        errorStr.toLowerCase().includes('rls') ||
        errorStr.toLowerCase().includes('violates row-level security policy') ||
        errorStr.toLowerCase().includes('policy')
      ) {
        setPendingItem(newItem);
        setRlsErrorMsg(errorStr);
      } else {
        alert("Error saving item: " + errorStr);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!itemName) {
      triggerNotification('Item name is required');
      return;
    }
    setIsSaving(true);
    const newItem: Partial<InventoryItem> = {
      ...initialItem,
      id: generateUUID(), // Force new ID
      name: `${itemName} (Copy)`,
      price: parseFloat(retailPrice) || 0,
      item_type: category,
      table_stock: 0, // Duplicated items start as new with 0 Table Stock
      van_stock: totalStartingStock,
      low_threshold: lowStockAlert,
      initial_batch_size: initialBatchSize,
      status: totalStartingStock > lowStockAlert ? 'Healthy' : totalStartingStock > criticalStockAlert ? 'Warning' : 'Critical',
      border_color: initialItem?.border_color || '#00ffcc', // Default new item color
      image_url: itemPhotoUrl || initialItem?.image_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
      image_path: itemImagePath || initialItem?.image_path || undefined,
      cost: parseFloat(unitCost) || undefined,
      sku: sku || undefined,
      unit_weight: unitWeight || undefined,
      package_type: packageType || undefined,
      variants: variants.map(v => ({ ...v, id: Date.now().toString() + Math.random().toString() })),
      isStorefrontActive
    } as any;

    try {
      const success = await onSave(newItem);
      if (success !== false) {
        triggerNotification('Item duplicated successfully');
        onBack();
      } else {
         alert("Failed to duplicate item. Please check connection.");
      }
    } catch (e: any) {
      const errorStr = String(e.message || e.description || JSON.stringify(e) || e);
      if (
        errorStr.toLowerCase().includes('row-level security') ||
        errorStr.toLowerCase().includes('rls') ||
        errorStr.toLowerCase().includes('violates row-level security policy') ||
        errorStr.toLowerCase().includes('policy')
      ) {
        setPendingItem(newItem);
        setRlsErrorMsg(errorStr);
      } else {
        alert("Error duplicating item: " + errorStr);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (initialItem?.id && onDelete) {
      onDelete(initialItem.id);
      triggerNotification('Item deleted');
      onBack();
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { id: Date.now().toString(), size: '', stock: '' }]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: 'size' | 'stock', value: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#13161d] border-b border-zinc-800 sticky top-0 z-10 pl-16 md:pl-20">
        <span className="font-display font-semibold text-lg text-white">{initialItem ? 'Edit Item' : 'Add New Item'}</span>
        <button 
          onClick={onBack}
          className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center transition-all cursor-pointer group"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Product Photos */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowProductPhotos(!showProductPhotos)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#0a84ff] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Product Photos</h3>
            </div>
            {showProductPhotos ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showProductPhotos && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {itemPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-900/50 bg-[#0f1f1d] group" style={{ minHeight: '160px' }}>
                    <img 
                      src={itemPhotoUrl} 
                      alt="Product preview" 
                      className="w-full h-full object-cover"
                      style={{ maxHeight: '240px' }}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>bucket: inventory-items</span>
                    </div>
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white font-mono text-xs z-20">
                        <RefreshCw className="w-6 h-6 text-[#00ffcc] animate-spin" />
                        <span>Uploading to 'inventory-items' bucket...</span>
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setItemPhotoUrl(null); setItemImagePath(null); setPhotoCount(0); }}
                      className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div 
                      className="absolute bottom-2 right-2 bg-black/60 px-3 py-1.5 rounded-lg text-white hover:bg-black transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
                      onClick={handlePhotoUploadClick}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Replace
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      onClick={(e) => e.stopPropagation()}
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>
                ) : (
                  <div 
                    className={`bg-[#0f1f1d] border ${isDragging ? 'border-[#00ffcc] bg-[#142825]' : 'border-emerald-900/50'} rounded-xl flex flex-col items-center justify-center border-dashed gap-2 cursor-pointer hover:bg-[#132422] transition-colors relative overflow-hidden`}
                    onClick={handlePhotoUploadClick}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    style={{ minHeight: '160px' }}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      onClick={(e) => e.stopPropagation()}
                      className="hidden" 
                      accept="image/*" 
                    />
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center relative z-10">
                      <ImageIcon className="w-5 h-5 text-[#0a84ff]" />
                    </div>
                    <div className="text-center relative z-10">
                      <span className="text-white font-bold block text-sm font-sans tracking-tight">Upload Photos</span>
                      <span className="text-zinc-400 font-sans text-xs">Drag & drop or tap to select</span>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                        <span>Supabase 'inventory-items' storage bucket</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Item Details */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowItemDetails(!showItemDetails)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#0a84ff] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Item Details</h3>
            </div>
            {showItemDetails ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showItemDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div>
                  <label className="text-zinc-300 font-bold text-xs mb-1 block">Item Name *</label>
                  <input 
                    type="text" 
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    maxLength={100}
                    placeholder="Enter item name"
                    className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg p-3 text-white font-sans placeholder-zinc-500 focus:outline-none focus:border-emerald-700 transition-colors"
                  />
                  <div className="text-[10px] text-zinc-600 mt-1">{itemName.length}/100 characters</div>
                </div>
                <div>
                  <label className="text-zinc-300 font-bold text-xs mb-1 block">Category *</label>
                  <div className="relative">
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg p-3 text-white font-bold tracking-wider appearance-none focus:outline-none focus:border-emerald-700 transition-colors"
                    >
                      <option value="APPAREL">APPAREL</option>
                      <option value="MUSIC">MUSIC</option>
                      <option value="ACCESSORIES">ACCESSORIES</option>
                      <option value="POSTERS">POSTERS</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#0a84ff]/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0a84ff]" />
                      </div>
                      <ChevronDown className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>



        {/* Pricing */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowPricing(!showPricing)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#0a84ff] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Pricing</h3>
            </div>
            {showPricing ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showPricing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-300 font-bold text-xs mb-1 block">Retail Price ($) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a84ff] font-bold">$</span>
                      <input 
                        type="number" 
                        value={retailPrice}
                        onChange={(e) => setRetailPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg py-3 pl-8 pr-3 text-zinc-400 font-sans focus:outline-none focus:border-emerald-700 transition-colors placeholder-zinc-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-300 font-bold text-xs mb-1 block">Unit Cost ($) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a84ff] font-bold">$</span>
                      <input 
                        type="number" 
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg py-3 pl-8 pr-3 text-zinc-400 font-sans focus:outline-none focus:border-emerald-700 transition-colors placeholder-zinc-600"
                      />
                    </div>
                  </div>
                </div>
                
                {showMargin ? (
                  <div className="bg-[#132422] border border-emerald-900/50 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-zinc-300 font-bold text-xs uppercase tracking-wide">Profit Margin Analytics</span>
                      </div>
                      <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        profitMarginPercent >= 50 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        profitMarginPercent >= 30 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {profitMarginPercent >= 50 ? 'High Margin' : profitMarginPercent >= 30 ? 'Healthy Margin' : 'Low Margin'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-1 division-x border-zinc-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 font-sans">Net Profit</span>
                        <span className="text-white font-mono font-bold text-sm">${profit.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-500 font-sans">Margin</span>
                        <span className={`font-mono font-black text-sm ${
                          profitMarginPercent >= 50 ? 'text-emerald-400' :
                          profitMarginPercent >= 30 ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>{profitMarginPercent}%</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-zinc-500 font-sans">ROI</span>
                        <span className="text-white font-mono font-bold text-sm">
                          {cost > 0 ? `${Math.round((profit / cost) * 100)}%` : '---'}
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden w-full mt-1.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          profitMarginPercent >= 50 ? 'bg-emerald-400' :
                          profitMarginPercent >= 30 ? 'bg-amber-400' :
                          'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, profitMarginPercent))}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#132422] border border-emerald-900/50 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#0a84ff]" />
                        <span className="text-zinc-300 font-bold text-xs uppercase tracking-wide">
                          {similarItemsStats ? 'Similar Items Category Prices' : `${category} Category Prices`}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                        {similarItemsStats ? 'Real-time Stats' : 'App Estimate'}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 font-sans font-medium">Min</span>
                        <span className="text-white font-mono font-bold">
                          ${similarItemsStats ? similarItemsStats.min.toFixed(2) : (category === 'APPAREL' ? '20.00' : category === 'MUSIC' ? '10.00' : category === 'POSTERS' ? '15.00' : '5.00')}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-500 font-sans font-medium">Avg</span>
                        <span className="text-white font-mono font-bold">
                          ${similarItemsStats ? similarItemsStats.avg.toFixed(2) : (category === 'APPAREL' ? '35.00' : category === 'MUSIC' ? '25.00' : category === 'POSTERS' ? '25.00' : '15.00')}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-zinc-500 font-sans font-medium">Max</span>
                        <span className="text-white font-mono font-bold">
                          ${similarItemsStats ? similarItemsStats.max.toFixed(2) : (category === 'APPAREL' ? '60.00' : category === 'MUSIC' ? '50.00' : category === 'POSTERS' ? '40.00' : '30.00')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sizes & Variants */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowSizes(!showSizes)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#0a84ff] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Sizes & Variants</h3>
              <span className="text-zinc-500 text-[10px] ml-1">(Custom names supported)</span>
              <div className="w-5 h-5 rounded-full bg-[#1a2b3b] text-[#0a84ff] flex items-center justify-center text-xs font-bold font-mono">{variants.length}</div>
            </div>
            {showSizes ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showSizes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm font-bold text-[#0a84ff]">
                    <button type="button" onClick={addVariant} className="flex items-center gap-1 hover:text-blue-400"><Plus className="w-4 h-4"/> Add</button>
                    <button type="button" onClick={applyStandardPresets} className="flex items-center gap-1 text-[#00ffcc] hover:text-[#00ffcc]/85 transition-colors font-bold"><ListPlus className="w-4 h-4"/> Presets</button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={`variant-${v.id || 'v'}-${i}`} className="flex gap-2 items-center">
                      <div className="flex-1">
                         {i === 0 && <label className="text-zinc-400 text-[10px] mb-1 block">Size / Variant</label>}
                         <input 
                           type="text" 
                           value={v.size}
                           onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                           placeholder="Medium"
                           className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-emerald-700 transition-colors"
                         />
                      </div>
                      <div className="w-1/3">
                         {i === 0 && <label className="text-zinc-400 text-[10px] mb-1 block">Van Stock</label>}
                         <input 
                           type="number" 
                           value={v.stock}
                           onChange={(e) => updateVariant(v.id, 'stock', e.target.value)}
                           placeholder="0"
                           className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-700 transition-colors"
                         />
                      </div>
                      <div className={`flex flex-col justify-end ${i === 0 ? 'h-[50px] pb-1' : ''}`}>
                         <button onClick={() => removeVariant(v.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#13161d] border border-zinc-800 rounded-lg p-3 mt-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">Total Starting Van Stock</span>
                    <span className="text-white font-bold">{totalStartingStock} units</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono italic leading-normal">
                    *New items start with 0 Table Stock. Use 'Van Transfer' prior to a show to move units to Table Stock.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Inventory Alerts */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowAlerts(!showAlerts)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#0a84ff] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Inventory Alerts</h3>
            </div>
            {showAlerts ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div className="bg-[#132422] border border-emerald-900/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#00ffcc]" />
                      <span className="text-white font-bold text-sm">Full Batch Reorder Size</span>
                    </div>
                    <span className="text-[#00ffcc] font-mono font-bold text-sm">{initialBatchSize} units</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    step="10"
                    value={initialBatchSize} 
                    onChange={(e) => setInitialBatchSize(parseInt(e.target.value))}
                    className="w-full accent-[#00ffcc] h-1 bg-emerald-900/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-400 font-mono leading-normal">
                    Set your standard printing batch size. The system will alert you when stock dips below 10% remaining.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Low Stock Alert Card */}
                  <div className="bg-[#132422] border border-emerald-900/50 rounded-xl p-4.5 flex flex-col justify-between space-y-3.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-white font-bold text-xs sm:text-sm">Low Alert</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2.5 bg-black/45 rounded-lg">
                      <span className="text-amber-500 font-mono font-bold text-xl leading-none">{lowStockAlert}</span>
                      <span className="text-[10px] text-zinc-500 font-medium mt-1">units</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        onClick={() => setLowStockAlert(Math.max(1, lowStockAlert - 1))}
                        className="flex-1 py-1.5 px-2 border border-emerald-990 hover:bg-emerald-950/40 text-zinc-200 hover:text-white rounded-lg bg-emerald-950/20 text-xs font-mono font-bold select-none transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setLowStockAlert(10)}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-[#00ffcc] bg-emerald-900/25 hover:bg-emerald-950 border border-emerald-800/40 hover:border-emerald-600/50 rounded-lg transition-all select-none cursor-pointer uppercase font-mono"
                      >
                        10u
                      </button>
                      <button
                        type="button"
                        onClick={() => setLowStockAlert(lowStockAlert + 1)}
                        className="flex-1 py-1.5 px-2 border border-emerald-990 hover:bg-emerald-950/40 text-zinc-200 hover:text-white rounded-lg bg-emerald-950/20 text-xs font-mono font-bold select-none transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Critical Stock Alert Card */}
                  <div className="bg-[#132422] border border-emerald-900/50 rounded-xl p-4.5 flex flex-col justify-between space-y-3.5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-white font-bold text-xs sm:text-sm">Critical Alert</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2.5 bg-black/45 rounded-lg">
                      <span className="text-rose-500 font-mono font-bold text-xl leading-none">{criticalStockAlert}</span>
                      <span className="text-[10px] text-zinc-500 font-medium mt-1">units</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        onClick={() => setCriticalStockAlert(Math.max(1, criticalStockAlert - 1))}
                        className="flex-1 py-1.5 px-2 border border-emerald-990 hover:bg-emerald-950/40 text-zinc-200 hover:text-white rounded-lg bg-emerald-950/20 text-xs font-mono font-bold select-none transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setCriticalStockAlert(3)}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-[#00ffcc] bg-emerald-900/25 hover:bg-emerald-950 border border-emerald-800/40 hover:border-emerald-600/50 rounded-lg transition-all select-none cursor-pointer uppercase font-mono"
                      >
                        3u
                      </button>
                      <button
                        type="button"
                        onClick={() => setCriticalStockAlert(criticalStockAlert + 1)}
                        className="flex-1 py-1.5 px-2 border border-emerald-990 hover:bg-emerald-950/40 text-zinc-200 hover:text-white rounded-lg bg-emerald-950/20 text-xs font-mono font-bold select-none transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Shipping Parameters */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowShipping(!showShipping)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#0a84ff] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Shipping Parameters</h3>
            </div>
            {showShipping ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showShipping && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-900/30 border border-zinc-900 rounded">
                  <div>
                    <label className="text-zinc-400 text-[10px] mb-1 block">Unit Weight</label>
                    <input 
                      type="text" 
                      value={unitWeight}
                      onChange={(e) => setUnitWeight(e.target.value)}
                      placeholder="0.00 lbs"
                      className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-emerald-700 transition-colors placeholder-zinc-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-[10px] mb-1 block">Package Type</label>
                    <select 
                      value={packageType}
                      onChange={(e) => setPackageType(e.target.value)}
                      className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-emerald-700 transition-colors text-xs"
                    >
                      <option value="Standard Polybag">Standard Polybag</option>
                      <option value="Media Flat">Media Flat</option>
                      <option value="Custom Carton">Custom Carton</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowTags(!showTags)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#0a84ff] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Tags</h3>
            </div>
            {showTags ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showTags && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableTags.map((tag, idx) => {
                    const isSelected = selectedTags.includes(tag.label);
                    return (
                      <button
                        key={`${tag.label}-${idx}`}
                        onClick={() => toggleTag(tag.label)}
                        className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 border text-xs font-bold transition-all ${
                          isSelected 
                            ? `${tag.bg} ${tag.border} ${tag.color}` 
                            : 'bg-[#13161d] border-zinc-800 text-zinc-500 hover:border-zinc-600'
                        }`}
                      >
                        <TagIcon className="w-3.5 h-3.5" />
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Advanced */}
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#0a84ff] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Barcode Generator</h3>
            </div>
            {showAdvanced ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4 pt-1"
              >
                <div className="bg-[#132422]/60 border border-emerald-900/30 rounded-xl p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-300 font-bold text-xs">SKU / BARCODE VALUE</label>
                      <button
                        type="button"
                        onClick={generateRandomSku}
                        className="text-[10px] bg-emerald-950/45 text-[#00ffcc] border border-emerald-800/40 px-2 py-1 rounded hover:bg-emerald-900 transition-all font-mono font-medium"
                      >
                        Generate Random SKU
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                      placeholder="e.g. AP-2940-L"
                      className="w-full bg-[#132422] border border-emerald-900/50 rounded-lg p-3 text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-emerald-700 transition-colors"
                    />
                    <span className="text-[9px] text-zinc-500 mt-1 block">Alphanumeric characters and hyphens only</span>
                  </div>

                  {sku && (
                    <div className="pt-2">
                      <span className="text-zinc-400 font-bold text-xs block mb-1">REAL-TIME BARCODE PREVIEW</span>
                      <SKUBarcode sku={sku} />
                      <div className="text-[9.5px] text-zinc-500 text-center font-mono mt-2">
                        Scan or tap the barcode area to copy value
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Public Storefront Status */}
        <div className="space-y-2 mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowStorefrontSettings(!showStorefrontSettings)}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#39ff14] rounded-full" />
              <h3 className="text-white font-bold tracking-tight">Public Storefront Status</h3>
            </div>
            {showStorefrontSettings ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
          <AnimatePresence>
            {showStorefrontSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#132422]/60 border border-emerald-900/40 rounded-xl p-4 flex items-center justify-between">
                  <div className="pr-4">
                    <span className="text-white font-bold block text-xs uppercase tracking-wider">Active on Public Storefront</span>
                    <span className="text-zinc-500 font-sans text-[10px] uppercase mt-0.5 block">If enabled, this item is published to your live Merch Shop</span>
                  </div>
                  <label className="relative flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only animate-none" 
                      checked={isStorefrontActive} 
                      onChange={(e) => setIsStorefrontActive(e.target.checked)} 
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${isStorefrontActive ? 'bg-[#39ff14]' : 'bg-black border border-zinc-800'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isStorefrontActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 pb-8">
          <button 
            disabled={isSaving}
            onClick={handleSave}
            className={`w-full ${
              isSaving 
                ? 'bg-blue-800 cursor-not-allowed' 
                : isOffline 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.25)] border border-amber-500/30' 
                  : 'bg-[#187bf5] hover:bg-blue-500 shadow-[0_0_15px_rgba(24,123,245,0.25)]'
            } text-white font-black rounded-[20px] py-4 flex items-center justify-center gap-2 transition-colors uppercase tracking-widest text-base cursor-pointer`}
          >
            <Save className="w-5 h-5 animate-pulse" />
            {isSaving 
              ? 'Saving...' 
              : isOffline 
                ? (initialItem ? 'Update on Device' : 'Save to Device') 
                : (initialItem ? 'Update Item' : 'Save Item')
            }
          </button>
          {initialItem && (
            <div className="grid grid-cols-2 gap-3">
              <button 
                disabled={isSaving}
                onClick={handleDuplicate}
                className={`w-full ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1a322e]'} bg-[#132422] text-emerald-400 border border-emerald-900/60 rounded-[18px] py-4 flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-wider transition-colors shadow-sm`}
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this item?')) {
                    handleDelete();
                  }
                }}
                className="w-full bg-[#241315] hover:bg-[#2f1418] text-rose-500 border border-rose-900/60 rounded-[18px] py-4 flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-wider transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Row-Level Security Troubleshooting Modal */}
        <AnimatePresence>
          {rlsErrorMsg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f1115] border-2 border-[#1c1f26] rounded-3xl p-6 max-w-xl w-full text-zinc-100 shadow-2xl relative overflow-hidden"
              >
                {/* Top highlight bar */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
                
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase font-display tracking-tight text-white">
                      Supabase Security Block
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      Row-Level Security (RLS) Active
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                  Your live Supabase database has Row-Level Security rules enabled on the <code className="bg-[#161a22] text-[#00ffcc] font-mono px-1.5 py-0.5 rounded text-[11px]">inventory</code> table, but lacks public write policies.
                </p>

                <div className="bg-[#090b0e] border border-[#1b1f28] rounded-xl p-3.5 mb-5 space-y-2 text-left">
                  <h4 className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest">
                    🔧 Fix this in Supabase:
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Copy the SQL commands below, paste them into the <strong>SQL Editor</strong> on your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#00ffcc] hover:text-[#00d195] underline font-bold">Supabase Dashboard</a>, and click <strong>Run</strong>:
                  </p>
                  
                  <div className="relative">
                    <pre className="text-[10px] font-mono bg-[#11141b] text-zinc-300 p-3 rounded-lg overflow-x-auto max-h-[140px] border border-[#202735] select-all leading-normal whitespace-pre">
{`ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select of inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow public insert of inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow public update of inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow public delete of inventory" ON public.inventory;

CREATE POLICY "Allow public select of inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert of inventory" ON public.inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of inventory" ON public.inventory FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of inventory" ON public.inventory FOR DELETE USING (true);`}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      const sqlText = `-- Enable RLS & Write permissions globally\nALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;\n\nDROP POLICY IF EXISTS "Allow public select of inventory" ON public.inventory;\nDROP POLICY IF EXISTS "Allow public insert of inventory" ON public.inventory;\nDROP POLICY IF EXISTS "Allow public update of inventory" ON public.inventory;\nDROP POLICY IF EXISTS "Allow public delete of inventory" ON public.inventory;\n\nCREATE POLICY "Allow public select of inventory" ON public.inventory FOR SELECT USING (true);\nCREATE POLICY "Allow public insert of inventory" ON public.inventory FOR INSERT WITH CHECK (true);\nCREATE POLICY "Allow public update of inventory" ON public.inventory FOR UPDATE USING (true);\nCREATE POLICY "Allow public delete of inventory" ON public.inventory FOR DELETE USING (true);`;
                      navigator.clipboard.writeText(sqlText).then(() => {
                        triggerNotification("📋 SQL copied! Paste into Supabase SQL Editor");
                      }).catch(() => {
                        triggerNotification("Failed to copy automatically.");
                      });
                    }}
                    className="flex-1 bg-[#161a22] hover:bg-[#202633] text-zinc-200 border border-[#2e3646] rounded-xl py-3.5 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    Copy SQL Command
                  </button>
                  <button
                    onClick={async () => {
                      if (pendingItem) {
                        const success = await onSave(pendingItem, true); // true = forceOffline mode
                        if (success !== false) {
                          triggerNotification("🟢 Saved safely to Local Browser Cache!");
                          setRlsErrorMsg(null);
                          setPendingItem(null);
                          onBack();
                        } else {
                          alert("Local-only save failed. Please check app state.");
                        }
                      }
                    }}
                    className="flex-1 bg-[#00d195] hover:bg-[#00ffcc] text-black rounded-xl py-3.5 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Offline
                  </button>
                </div>

                <button
                  onClick={() => {
                    setRlsErrorMsg(null);
                    setPendingItem(null);
                  }}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function TagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  )
}

function SKUBarcode({ sku }: { sku: string }) {
  if (!sku) return null;
  const cleanSku = sku.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const charPatterns: Record<string, string> = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011'
  };

  let bits = '1001011011010'; 
  for (let i = 0; i < cleanSku.length; i++) {
    const char = cleanSku[i];
    const pattern = charPatterns[char] || '101010110110';
    bits += pattern + '0';
  }
  bits += '100101101101';

  const bars: React.ReactElement[] = [];
  let currentPos = 0;
  const barWidth = 2;
  const barHeight = 48;

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      let run = 1;
      while (i + 1 < bits.length && bits[i + 1] === '1') {
        run++;
        i++;
      }
      bars.push(
        <rect
          key={`additem-stock-bar-${i}`}
          x={currentPos}
          y={0}
          width={run * barWidth}
          height={barHeight}
          fill="#ffffff"
        />
      );
      currentPos += run * barWidth;
    } else {
      let run = 1;
      while (i + 1 < bits.length && bits[i + 1] === '0') {
        run++;
        i++;
      }
      currentPos += run * barWidth;
    }
  }

  const svgWidth = currentPos;

  return (
    <div className="flex flex-col items-center bg-[#181d26]/80 border border-[#2e3444]/30 rounded-xl p-3 space-y-2 mt-2 select-all">
      <div className="overflow-x-auto max-w-full py-1.5 flex justify-center">
        <svg
          width={svgWidth}
          height={barHeight}
          viewBox={`0 0 ${svgWidth} ${barHeight}`}
          className="mx-auto"
        >
          {bars}
        </svg>
      </div>
      <span className="font-mono text-[10px] font-black tracking-[0.25em] text-[#00ffcc] uppercase select-all">*{cleanSku || 'EMPTY'}*</span>
    </div>
  );
}
