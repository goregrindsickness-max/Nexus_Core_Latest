import React, { useState, useMemo } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { 
  ChevronLeft, 
  Settings, 
  Calendar, 
  ChevronDown, 
  Plus, 
  Minus, 
  X, 
  Check, 
  AlertTriangle,
  ShoppingCart,
  Coins,
  QrCode,
  CreditCard,
  Sparkles,
  ChevronRight,
  Trash2,
  Percent,
  DollarSign,
  ArrowRightLeft,
  PackagePlus,
  Layers,
  Wifi,
  Bluetooth,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem, Show, Sale, LoyaltyMember } from '../../types';
import { getSupabase } from '../../supabase';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "AeEkSF6a4F4Pj6y1KOMNbAupbepEsQTkjvdJY5tZpEw9qne0uo6neiAd1T6LP52e0xbQAuZVpECXUtLI";

interface SalesDashboardViewProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  shows: Show[];
  setShows: React.Dispatch<React.SetStateAction<Show[]>>;
  onSubmitSale: (type: 'sale' | 'show' | 'note', payload: any) => Promise<void>;
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  activeBandId: string;
  activeBandName: string;
  onOpenTransferModal?: (itemId?: string) => void;
  onOpenCashDrawer?: () => void;
  onSettleShow?: (showId: string) => void;
  loyaltyMembers?: LoyaltyMember[];
  setLoyaltyMembers?: React.Dispatch<React.SetStateAction<LoyaltyMember[]>>;
  commitInventoryMutation?: (itemsData: InventoryItem | InventoryItem[]) => void;
}

// In-memory variant stocks mapped to items. This allows live tracking of specific sizes/colors!
interface Variant {
  name: string;
  stock: number;
  maxStock: number;
}

export default function SalesDashboardView({
  inventory,
  setInventory,
  shows,
  setShows,
  onSubmitSale,
  onBack,
  triggerNotification,
  addLog,
  activeBandId,
  activeBandName,
  onOpenTransferModal,
  onOpenCashDrawer,
  onSettleShow,
  loyaltyMembers = [],
  setLoyaltyMembers,
  commitInventoryMutation
}: SalesDashboardViewProps) {
  // Navigation & Filtering State
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'APPAREL' | 'MEDIA' | 'ACCESSORIES'>('ALL');
  
  // Show Dropdown Selector States
  const [isShowDropdownOpen, setIsShowDropdownOpen] = useState(false);
  const [selectedShowId, setSelectedShowId] = useState<string>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = shows.find(s => s.date >= todayStr) || shows[0];
    return upcoming ? upcoming.id : '';
  });

  const activeShow = useMemo(() => {
    return shows.find(s => s.id === selectedShowId) || shows[0];
  }, [shows, selectedShowId]);

  // Size Picker popup state
  const [pickerItem, setPickerItem] = useState<InventoryItem | null>(null);
  
  // We model size-level live stocks for selected items dynamically and persist them in temporary view state.
  const [itemVariants, setItemVariants] = useState<Record<string, Variant[]>>({});

  // Safe getter & generator for variant structures with realistic weight distribution (no hardcoded zero sizes unless general stock is exhausted)
  const generateVariantsForProduct = (item: InventoryItem): Variant[] => {
    // If the item actually has real variants saved in the database, use those!
    if (item.variants && item.variants.length > 0) {
      return item.variants.map(v => ({
        name: v.size || 'Base',
        stock: parseInt(v.stock) || 0,
        maxStock: parseInt(v.stock) || 0
      }));
    }

    // Fallback: Create automatic variants based on general category if none saved
    const isApparel = item?.name.toLowerCase().includes('tee') || 
                      item?.name.toLowerCase().includes('shirt') || 
                      item?.name.toLowerCase().includes('hoodie') ||
                      item?.name.toLowerCase().includes('longsleeve') || 
                      item.item_type === 'Multiple' ||
                      item.item_type === 'APPAREL';

    if (isApparel) {
      // Divide table_stock across S, M, L, XL, 2XL sizes based on real merch booth frequencies
      const total = item.table_stock;
      const weights = [0.15, 0.30, 0.30, 0.15, 0.10]; // S=15%, M=30%, L=30%, XL=15%, 2XL=10%
      const names = ['Small', 'Medium', 'Large', 'XL', '2XL'];
      
      let allocated = names.map(() => 0);
      let remaining = total;
      
      // Pass 1: Floor assignment
      names.forEach((_, idx) => {
        const share = Math.floor(total * weights[idx]);
        allocated[idx] = share;
        remaining -= share;
      });
      
      // Pass 2: Leftover distribution to fast-moving sizes
      const priorityOrder = [1, 2, 0, 3, 4]; // Medium, Large, Small, XL, 2XL
      let pIdx = 0;
      while (remaining > 0) {
        const targetIdx = priorityOrder[pIdx % priorityOrder.length];
        allocated[targetIdx] += 1;
        remaining -= 1;
        pIdx++;
      }

      return names.map((name, idx) => ({
        name,
        stock: allocated[idx],
        maxStock: allocated[idx] + 15
      }));
    } else if (item.item_type === 'ACCESSORIES' && (item?.name.toLowerCase().includes('patch') || item?.name.toLowerCase().includes('hat'))) {
      const split = Math.floor(item.table_stock / 2);
      return [
        { name: 'Variant A', stock: split, maxStock: split + 10 },
        { name: 'Variant B', stock: item.table_stock - split, maxStock: split + 10 },
      ];
    } else {
      // Standard item
      return [
        { name: 'Universal', stock: item.table_stock, maxStock: item.table_stock + 30 }
      ];
    }
  };

  const getVariantsForProduct = (item: InventoryItem): Variant[] => {
    const cached = itemVariants[item.id];
    if (cached) {
      // Self-healing: cross-check if cached size quantities sum up to the parent's current table_stock.
      // If someone audited, restocked, or synchronized, total cached stock won't match. Re-allocate!
      const totalCachedStock = cached.reduce((sum, v) => sum + v.stock, 0);
      if (totalCachedStock === item.table_stock) {
        return cached;
      }
    }
    return generateVariantsForProduct(item);
  };

  // Temp selected state inside variant picking popup
  const [quantitiesState, setQuantitiesState] = useState<Record<string, number>>({});

  // Active Cart State (storing item_id, name, type/size, qty, unit price, image_url)
  const [cart, setCart] = useState<Array<{
    itemId: string;
    name: string;
    variantName: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>>([]);

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR' | 'CARD' | 'PAYPAL'>('CASH');
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('team-1');
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  const [paypalCheckoutMode, setPaypalCheckoutMode] = useState<'SELF' | 'MERCHANT'>('SELF');
  const [currentPaypalOrderId, setCurrentPaypalOrderId] = useState<string>('');
  const [addSalesTax, setAddSalesTax] = useState(false);
  const [isGiveaway, setIsGiveaway] = useState(false);
  const [discountType, setDiscountType] = useState<'$' | '%'>('$');
  const [discountValue, setDiscountValue] = useState<string>('');
  
  // Tipping and crew support states
  const [tipType, setTipType] = useState<'none' | '10%' | '15%' | '20%' | 'custom'>('none');
  const [customTipValue, setCustomTipValue] = useState<string>('');
  
  // HARDWARE ECO-MODE: CPU & BACKGROUND THROTTLING
  const [isPosTerminalEngaged, setIsPosTerminalEngaged] = useState(false);

  // Sync this state with the checkout drawer opening
  React.useEffect(() => {
    setIsPosTerminalEngaged(isCheckoutDrawerOpen);
  }, [isCheckoutDrawerOpen]);

  // REAL-TIME MULTI-DEVICE SESSION SYNCING (SUPABASE REALTIME)
  React.useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase.channel('pos-sync-distro')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'distro_store_items' }, payload => {
        if (payload.new) {
           setInventory(prev => {
             const exists = prev.find(p => p.id === payload.new.id);
             if (!exists) return [...prev, payload.new as InventoryItem];
             return prev;
           });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'distro_store_items' }, payload => {
        if (payload.new) {
          const updated = payload.new as any;
          setInventory(prev => prev.map(item => item.id === updated.id ? { ...item, ...updated } : item));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'staged_tickets' }, payload => {
        console.log("Realtime INSERT staged_tickets received", payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'staged_tickets' }, payload => {
        console.log("Realtime UPDATE staged_tickets received", payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel).then();
    };
  }, [setInventory]);

  // Background Throttling Loop (Resume Outward Streaming on Idle)
  React.useEffect(() => {
    let backgroundInterval: NodeJS.Timeout;
    
    if (!isPosTerminalEngaged) {
      // Resume outward streaming / normal background fetching when IDLE
      backgroundInterval = setInterval(() => {
        // Mock external polling for hardware demo
        // console.log("[SYSTEM] Executing standard background polling (historical Sales Trends, Net Proximity Yield, VIP Loyalty Ledgers)");
      }, 5000);
    } else {
      // console.log("[ECO-MODE] POS Terminal engaged. Strict CPU & background throttling activated. Deferring metrics recalculations.");
    }

    return () => {
      if (backgroundInterval) clearInterval(backgroundInterval);
    };
  }, [isPosTerminalEngaged]);

  // Cutoff calculation: Past 4:00 AM local time on the morning after the active show date
  const isPastShowCutoff = useMemo(() => {
    if (!activeShow || !activeShow.date) return false;
    try {
      const showParts = activeShow.date.split('-');
      if (showParts.length !== 3) return false;
      const year = parseInt(showParts[0], 10);
      const month = parseInt(showParts[1], 10) - 1;
      const day = parseInt(showParts[2], 10);
      
      const showDateObj = new Date(year, month, day);
      const cutoffDateObj = new Date(showDateObj);
      cutoffDateObj.setDate(cutoffDateObj.getDate() + 1);
      cutoffDateObj.setHours(4, 0, 0, 0);
      
      const now = new Date();
      return now.getTime() > cutoffDateObj.getTime();
    } catch (e) {
      console.error("Error calculating show cutoff time", e);
      return false;
    }
  }, [activeShow]);

  // Loyalty checkout integration states
  const [appliedLoyaltyMember, setAppliedLoyaltyMember] = useState<LoyaltyMember | null>(null);
  const [appliedLoyaltyDiscountType, setAppliedLoyaltyDiscountType] = useState<'none' | 'lifetime' | 'signup'>('none');
  const [loyaltySearchPhone, setLoyaltySearchPhone] = useState('');
  const [loyaltySearchPin, setLoyaltySearchPin] = useState('');
  const [loyaltyPromoInput, setLoyaltyPromoInput] = useState('');
  const [isLoyaltyExpanded, setIsLoyaltyExpanded] = useState(false);
  const [cashAppCashtag, setCashAppCashtag] = useState<string>(() => {
    try {
      return localStorage.getItem('cashapp_cashtag') || 'bandmerch';
    } catch (_) {
      return 'bandmerch';
    }
  });

  const handleCashtagChange = (val: string) => {
    let clean = val.trim();
    if (clean.startsWith('$')) {
      clean = clean.substring(1);
    }
    setCashAppCashtag(clean);
    try {
      localStorage.setItem('cashapp_cashtag', clean);
    } catch (_) {}
  };

  // Cash exact amount state
  const [cashGivenOption, setCashGivenOption] = useState<'exact' | '20' | '50' | '100' | 'custom' | null>(null);
  const [customCashValue, setCustomCashValue] = useState<string>('');

  // Card payment integrated interactive states
  const [cardCheckoutTab, setCardCheckoutTab] = useState<'NFC' | 'READER'>('NFC');
  const [nfcScanStatus, setNfcScanStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [readerStatus, setReaderStatus] = useState<'IDLE' | 'WAITING_FOR_CARD' | 'SUCCESS'>('IDLE');
  const [hardwareReaderBattery, setHardwareReaderBattery] = useState<number>(87);
  const [hardwareReaderSignal, setHardwareReaderSignal] = useState<'EXCELLENT' | 'GOOD' | 'CONNECTED'>('EXCELLENT');
  const [isCardProcessing, setIsCardProcessing] = useState<boolean>(false);
  const [cardScannedName, setCardScannedName] = useState<string>('');
  const [cardScannedDetails, setCardScannedDetails] = useState<string>('');

  // Bundle Modal State
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [bundleItems, setBundleItems] = useState<Array<{ item: InventoryItem, variantName: string, quantity: number }>>([]);
  const [bundlePrice, setBundlePrice] = useState<string>('');
  const [bundleName, setBundleName] = useState<string>('Custom Bundle');

  // Checkout success & celebration states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleDetails, setLastSaleDetails] = useState<{ amount: number; paymentMethod: string; itemCount: number } | null>(null);

  // Computed Values
  const cartTotalItemCount = useMemo(() => {
    return cart.reduce((sum, c) => sum + c.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, c) => sum + (c.price * c.quantity), 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return addSalesTax ? Math.round(cartSubtotal * 0.085) : 0;
  }, [cartSubtotal, addSalesTax]);

  const manualDiscountAmount = useMemo(() => {
    if (!discountValue || isNaN(Number(discountValue))) return 0;
    const val = Number(discountValue);
    if (discountType === '$') {
      return Math.round(Math.min(val, cartSubtotal)); // Cannot discount more than subtotal
    } else {
      return Math.round(cartSubtotal * (val / 100));
    }
  }, [cartSubtotal, discountValue, discountType]);

  const loyaltyDiscountAmount = useMemo(() => {
    if (appliedLoyaltyDiscountType === 'signup') {
      return Math.round(cartSubtotal * 0.20);
    }
    if (appliedLoyaltyDiscountType === 'lifetime') {
      return Math.round(cartSubtotal * 0.10);
    }
    return 0;
  }, [cartSubtotal, appliedLoyaltyDiscountType]);

  const discountAmount = useMemo(() => {
    return Math.min(cartSubtotal, manualDiscountAmount + loyaltyDiscountAmount);
  }, [manualDiscountAmount, loyaltyDiscountAmount, cartSubtotal]);

  const calculatedTipAmount = useMemo(() => {
    if (tipType === 'none') return 0;
    if (tipType === '10%') return Math.round(cartSubtotal * 0.1);
    if (tipType === '15%') return Math.round(cartSubtotal * 0.15);
    if (tipType === '20%') return Math.round(cartSubtotal * 0.2);
    if (tipType === 'custom' && customTipValue && !isNaN(Number(customTipValue))) {
      return Number(customTipValue);
    }
    return 0;
  }, [tipType, customTipValue, cartSubtotal]);

  const cartTotalValue = useMemo(() => {
    if (isGiveaway) return 0;
    return Math.max(0, Math.round(cartSubtotal + taxAmount - discountAmount + calculatedTipAmount));
  }, [cartSubtotal, taxAmount, discountAmount, isGiveaway, calculatedTipAmount]);


  const cashReceived = useMemo(() => {
    if (cashGivenOption === 'exact') return cartTotalValue;
    if (cashGivenOption === '20') return 20;
    if (cashGivenOption === '50') return 50;
    if (cashGivenOption === '100') return 100;
    if (cashGivenOption === 'custom' && customCashValue) return Number(customCashValue);
    return null;
  }, [cashGivenOption, customCashValue, cartTotalValue]);

  const changeDue = useMemo(() => {
    return cashReceived !== null ? Math.max(0, cashReceived - cartTotalValue) : 0;
  }, [cashReceived, cartTotalValue]);

  // Handle open size/variant picker or add directly
  const handleItemClick = (item: InventoryItem) => {
    const list = getVariantsForProduct(item);
    
    // Ensure the variants are cached for consistent in-memory deductions
    if (!itemVariants[item.id]) {
      setItemVariants(prev => ({
        ...prev,
        [item.id]: list
      }));
    }
    
    if (list.length === 1) {
      // Direct add to cart
      const variantName = list[0].name;
      const existing = cart.find(c => c.itemId === item.id && c.variantName === variantName);
      
      // Stock check
      const currentStock = list[0].stock;
      const proposedQty = existing ? existing.quantity + 1 : 1;
      if (proposedQty > currentStock) {
        triggerNotification(`Cannot exceed table stock (${currentStock} available).`);
        return;
      }

      if (existing) {
        setCart(prev => prev.map(c => 
          (c.itemId === item.id && c.variantName === variantName) 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        ));
      } else {
        setCart(prev => [...prev, {
          itemId: item.id,
          name: item?.name,
          variantName: variantName,
          quantity: 1,
          price: item.price,
          image_url: item.image_url
        }]);
      }
      triggerNotification(`Added ${item?.name} to basket.`);
      return;
    }

    // Initialize picker counters with current quantities in cart if any
    const initialQtys: Record<string, number> = {};
    list.forEach(v => {
      const existing = cart.find(c => c.itemId === item.id && c.variantName === v.name);
      initialQtys[v.name] = existing ? existing.quantity : 0;
    });

    setQuantitiesState(initialQtys);
    setPickerItem(item);
  };

  // Update counter in modal
  const handleModifyModalQty = (variantName: string, delta: number, stockAvailable: number) => {
    setQuantitiesState(prev => {
      const current = prev[variantName] || 0;
      const next = current + delta;
      
      // Boundaries
      if (next < 0) return prev;
      if (next > stockAvailable) {
        triggerNotification(`Cannot exceed table stock limits (${stockAvailable} available).`);
        return prev;
      }
      return { ...prev, [variantName]: next };
    });
  };

  // Commit selected sizes to cart
  const handleConfirmVariants = () => {
    if (!pickerItem) return;

    // Filter non-zero items
    const selectedList = Object.entries(quantitiesState).filter(([_, qty]) => Number(qty) > 0);

    // Filter current product's other sizes from cart first to overwrite
    let updatedCart = cart.filter(c => c.itemId !== pickerItem.id);

    selectedList.forEach(([variantName, qty]) => {
      updatedCart.push({
        itemId: pickerItem.id,
        name: pickerItem.name,
        variantName,
        quantity: Number(qty),
        price: pickerItem.price,
        image_url: pickerItem.image_url
      });
    });

    setCart(updatedCart);
    setPickerItem(null);
    triggerNotification(`Updated cart with: ${pickerItem.name}`);
  };

  const handleConfirmBundle = () => {
    if (bundleItems.length < 2) {
      triggerNotification("A bundle needs at least 2 items.");
      return;
    }
    const finalPrice = parseFloat(bundlePrice);
    if (isNaN(finalPrice) || finalPrice < 0) {
      triggerNotification("Please enter a valid bundle price.");
      return;
    }

    const totalItems = bundleItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const pricePerItem = finalPrice / totalItems;

    const newCartItems = bundleItems.map(bi => ({
      itemId: bi.item.id,
      name: `${bi.item?.name} (Bundle)`,
      variantName: bi.variantName,
      quantity: bi.quantity,
      price: pricePerItem,
      image_url: bi.item.image_url
    }));

    setCart(prev => [...prev, ...newCartItems]);
    setIsBundleModalOpen(false);
    setBundleItems([]);
    setBundlePrice('');
    triggerNotification(`Added bundle for $${finalPrice} to basket.`);
  };

  const handleToggleBundleItem = (item: InventoryItem, variantName: string) => {
    setBundleItems(prev => {
      const exists = prev.find(p => p.item.id === item.id && p.variantName === variantName);
      if (exists) {
        return prev.filter(p => !(p.item.id === item.id && p.variantName === variantName));
      } else {
        return [...prev, { item, variantName, quantity: 1 }];
      }
    });
  };

  // Categories lists logic
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // Primary category check
      if (selectedCategory !== 'ALL') {
        const type = item.item_type.toUpperCase();
        const nameLower = item?.name.toLowerCase();
        
        if (selectedCategory === 'APPAREL') {
          const isApparel = type === 'MULTIPLE' || 
                            nameLower.includes('tee') || 
                            nameLower.includes('shirt') || 
                            nameLower.includes('hoodie') || 
                            nameLower.includes('longsleeve');
          if (!isApparel) return false;
        }

        if (selectedCategory === 'MEDIA') {
          const isMedia = type === 'CD' || 
                          type === 'VINYL' || 
                          nameLower.includes('cd') || 
                          nameLower.includes('album') || 
                          nameLower.includes('cassette');
          if (!isMedia) return false;
        }

        if (selectedCategory === 'ACCESSORIES') {
          const isAccessory = type === 'STICKER' || 
                              type === 'WALL FLAG' || 
                              type === 'ONE SIZE' || 
                              nameLower.includes('sticker') || 
                              nameLower.includes('patch') || 
                              nameLower.includes('flag') ||
                              nameLower.includes('hat');
          if (!isAccessory) return false;
        }
      }
      return true;
    });
  }, [inventory, selectedCategory]);

  // Split products into Featured vs Grid remaining
  const featuredProduct = useMemo(() => {
    if (filteredInventory.length === 0) return null;
    
    // Prioritize an 'Apparel' or 'Multiple' type item with highest price as featured
    const apparelItems = filteredInventory.filter(i => 
      i.item_type === 'Multiple' || 
      i.item_type === 'APPAREL' || 
      i.name.toLowerCase().includes('shirt') || 
      i.name.toLowerCase().includes('hoodie') ||
      i.name.toLowerCase().includes('tee') ||
      i.name.toLowerCase().includes('longsleeve')
    );
    
    if (apparelItems.length > 0) {
      // Sort to get the most expensive one
      const sortedApparel = [...apparelItems].sort((a, b) => b.price - a.price);
      return sortedApparel[0];
    }
    
    // Fallback to highest price item overall
    const sortedAll = [...filteredInventory].sort((a, b) => b.price - a.price);
    return sortedAll[0];
  }, [filteredInventory]);

  const gridProducts = useMemo(() => {
    if (!featuredProduct) return filteredInventory;
    return filteredInventory.filter(i => i.id !== featuredProduct.id);
  }, [filteredInventory, featuredProduct]);

  // Create or refresh Order ID when PayPal method becomes active
  React.useEffect(() => {
    if (isCheckoutDrawerOpen && paymentMethod === 'PAYPAL') {
      if (!currentPaypalOrderId) {
        setCurrentPaypalOrderId('NC-PAY-' + Math.random().toString(36).substring(2, 9).toUpperCase());
      }
    } else if (!isCheckoutDrawerOpen) {
      setCurrentPaypalOrderId('');
    }
  }, [isCheckoutDrawerOpen, paymentMethod]);

  // Complete Transaction locally after contactless customer payment confirmation
  const handleCustomerPaidSelfCheckout = React.useCallback(async (forcedId?: string) => {
    try {
      const activeId = forcedId || currentPaypalOrderId;
      addLog(`Customer self-checkout contactless payment confirmed for ID [${activeId}]. Syncing local inventory...`);
      
      // Update live variant stocks in this panel's memory
      for (const cartItem of cart) {
        setItemVariants(prev => {
          const existing = prev[cartItem.itemId];
          if (!existing) return prev;
          return {
            ...prev,
            [cartItem.itemId]: existing.map(v => 
              v.name === cartItem.variantName 
                ? { ...v, stock: Math.max(0, v.stock - cartItem.quantity) }
                : v
            )
          };
        });
      }

      // Decrement parent inventory quantities state
      setInventory(prev => {
        return prev.map(invItem => {
          const soldForThisItem = cart.filter(c => c.itemId === invItem.id);
          if (soldForThisItem.length > 0) {
            const totalSold = soldForThisItem.reduce((sum, c) => sum + c.quantity, 0);
            const nextTableStock = Math.max(0, invItem.table_stock - totalSold);
            const nextStatus = nextTableStock <= 18 ? 'Critical' : nextTableStock <= 25 ? 'Warning' : 'Healthy';
            
            const nextVariants = invItem.variants?.map(v => {
              const matchingSale = soldForThisItem.find(c => c.variantName === (v.size || 'Base'));
              if (matchingSale) {
                return { ...v, stock: String(Math.max(0, parseInt(v.stock) - matchingSale.quantity)) };
              }
              return v;
            });

            return {
              ...invItem,
              table_stock: nextTableStock,
              status: nextStatus,
              variants: nextVariants || invItem.variants
            };
          }
          return invItem;
        });
      });

      const finalAmount = cartTotalValue;
      const finalCount = cartTotalItemCount;

      // Clear Cart & success transitions
      setCart([]);
      setCashGivenOption(null);
      setCustomCashValue('');
      setAddSalesTax(false);
      setIsGiveaway(false);
      setDiscountValue('');
      setTipType('none');
      setCustomTipValue('');
      setAppliedLoyaltyMember(null);
      setAppliedLoyaltyDiscountType('none');
      setLoyaltySearchPhone('');
      setLoyaltySearchPin('');
      setLoyaltyPromoInput('');
      setIsCheckoutDrawerOpen(false);

      // Trigger Celebration Overlay
      setLastSaleDetails({ amount: finalAmount, paymentMethod: 'PAYPAL', itemCount: finalCount });
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        setLastSaleDetails(null);
      }, 3000);

      triggerNotification(`💰 Contactless Checkout Success: $${finalAmount.toFixed(0)} payment received.`);
      addLog(`Checkout completed via customer device. Stocks synchronized.`);
    } catch (err: any) {
      console.error("Error confirming contactless payment completion:", err);
      triggerNotification("Error synchronizing contactless checkout.");
    }
  }, [cart, cartTotalValue, cartTotalItemCount, currentPaypalOrderId, setInventory, setItemVariants, triggerNotification, addLog]);

  // Poll Supabase backend for active order payment matches
  React.useEffect(() => {
    if (paymentMethod !== 'PAYPAL' || !isCheckoutDrawerOpen || !currentPaypalOrderId || paypalCheckoutMode !== 'SELF') return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      if (!isSubscribed) return;

      const supabase = getSupabase();
      if (supabase && navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from('sales')
            .select('id')
            .eq('id', currentPaypalOrderId)
            .maybeSingle();

          if (data && !error && isSubscribed) {
            clearInterval(interval);
            handleCustomerPaidSelfCheckout();
          }
        } catch (e) {
          console.error("Supabase polling error:", e);
        }
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [paymentMethod, isCheckoutDrawerOpen, currentPaypalOrderId, paypalCheckoutMode, handleCustomerPaidSelfCheckout]);

  // Complete Transaction & update real states
  const handleCheckoutSubmit = async (methodOverride?: 'CASH' | 'CARD' | 'QR' | 'PAYPAL') => {
    if (cart.length === 0) {
      triggerNotification("Your cart is empty.");
      return;
    }

    const finalMethod = methodOverride || paymentMethod;

    try {
      addLog(`Initiating checkout process for ${cartTotalItemCount} items ($${cartTotalValue.toFixed(0)} total)...`);

      // 1. Submit combined sale
      let saleItemName = "Mixed Basket";
      let saleItemType = "Multiple Items";
      
      if (cart.length === 1) {
        saleItemName = cart[0].name;
        saleItemType = cart[0].variantName;
      } else if (cart.length > 1) {
        const firstItem = cart[0];
        const remainingItems = cartTotalItemCount - firstItem.quantity;
        if (remainingItems > 0) {
          saleItemName = `${firstItem.name} + ${remainingItems} item${remainingItems > 1 ? 's' : ''}`;
        } else {
          saleItemName = firstItem.name;
        }
      }

      await onSubmitSale('sale', {
        item_name: saleItemName,
        quantity: cartTotalItemCount,
        item_type: saleItemType,
        amount: cartTotalValue,
        payment_method: finalMethod,
        image_url: cart[0]?.image_url,
        cart_items: cart,
        team_member_id: selectedTeamMemberId
      });

      // Update live variant stocks in this panel's memory
      for (const cartItem of cart) {
        setItemVariants(prev => {
          const existing = prev[cartItem.itemId];
          if (!existing) return prev;
          return {
            ...prev,
            [cartItem.itemId]: existing.map(v => 
              v.name === cartItem.variantName 
                ? { ...v, stock: Math.max(0, v.stock - cartItem.quantity) }
                : v
            )
          };
        });
      }

      // 2. Decrement real parent inventory quantities state
      if (commitInventoryMutation) {
        const mutatedItems = inventory.filter(invItem => (cart || []).some(c => c.itemId === invItem.id)).map(invItem => {
          const soldForThisItem = cart.filter(c => c.itemId === invItem.id);
          const totalSold = soldForThisItem.reduce((sum, c) => sum + c.quantity, 0);
          const nextTableStock = Math.max(0, invItem.table_stock - totalSold);
          const nextStatus = nextTableStock <= 18 ? 'Critical' : nextTableStock <= 25 ? 'Warning' : 'Healthy';
          
          const nextVariants = invItem.variants?.map(v => {
            const matchingSale = soldForThisItem.find(c => c.variantName === (v.size || 'Base'));
            if (matchingSale) {
              return { ...v, stock: String(Math.max(0, parseInt(v.stock) - matchingSale.quantity)) };
            }
            return v;
          });

          return {
            ...invItem,
            table_stock: nextTableStock,
            status: nextStatus as "Critical" | "Warning" | "Healthy",
            variants: nextVariants || invItem.variants
          };
        });
        
        if (mutatedItems.length > 0) {
          commitInventoryMutation(mutatedItems);
        }
      } else {
        setInventory(prev => {
          return prev.map(invItem => {
            // Find sum of all item's variants sold
            const soldForThisItem = cart.filter(c => c.itemId === invItem.id);
            if (soldForThisItem.length > 0) {
              const totalSold = soldForThisItem.reduce((sum, c) => sum + c.quantity, 0);
              const nextTableStock = Math.max(0, invItem.table_stock - totalSold);
              const nextStatus = nextTableStock <= 18 ? 'Critical' : nextTableStock <= 25 ? 'Warning' : 'Healthy';
              
              // Also deduct from explicit variants if they exist
              const nextVariants = invItem.variants?.map(v => {
                const matchingSale = soldForThisItem.find(c => c.variantName === (v.size || 'Base'));
                if (matchingSale) {
                  return { ...v, stock: String(Math.max(0, parseInt(v.stock) - matchingSale.quantity)) };
                }
                return v;
              });

              return {
                ...invItem,
                table_stock: nextTableStock,
                status: nextStatus,
                variants: nextVariants || invItem.variants
              };
            }
            return invItem;
          });
        });
      }

      // Increment Loyalty Member Count if applied
      if (appliedLoyaltyMember) {
        const nextUses = (appliedLoyaltyMember.lifetime_discount_uses || 0) + 1;
        if (setLoyaltyMembers) {
          setLoyaltyMembers(prev => prev.map(m => m.id === appliedLoyaltyMember.id ? { ...m, lifetime_discount_uses: nextUses } : m));
        }
        
        const supabase = getSupabase();
        if (supabase && navigator.onLine) {
          try {
            await supabase.from('loyalty_members').update({ lifetime_discount_uses: nextUses }).eq('id', appliedLoyaltyMember.id);
          } catch (e) {
            console.error('Failed to update member uses in db:', e);
          }
        }
        addLog(`Registered loyalty VIP discount usage for member "${appliedLoyaltyMember.name}".`);
      }

      // Capture totals for showing on the successful modal celebration
      const finalAmount = cartTotalValue;
      const finalCount = cartTotalItemCount;

      // Clear Cart & success transitions
      setCart([]);
      setCashGivenOption(null);
      setCustomCashValue('');
      setAddSalesTax(false);
      setIsGiveaway(false);
      setDiscountValue('');
      setTipType('none');
      setCustomTipValue('');
      setAppliedLoyaltyMember(null);
      setAppliedLoyaltyDiscountType('none');
      setLoyaltySearchPhone('');
      setLoyaltySearchPin('');
      setLoyaltyPromoInput('');
      setIsCheckoutDrawerOpen(false);

      // Trigger Celebration Overlay
      setLastSaleDetails({ amount: finalAmount, paymentMethod: finalMethod, itemCount: finalCount });
      setShowSuccessModal(true);

      // Automatically "bounce back" to the dashboard by hiding success modal after max 3s (3000ms)
      setTimeout(() => {
        setShowSuccessModal(false);
        setLastSaleDetails(null);
      }, 3000);

      triggerNotification(`Completed Checkout: $${finalAmount.toFixed(0)} recorded using ${finalMethod}!`);
      addLog(`Checkout completed. Stocks updated.`);
    } catch (err: any) {
      addLog(`Checkout compilation error: ${err.message}`);
      triggerNotification("Failure during transaction commit.");
    }
  };

  // Remove individual cart row
  const handleRemoveFromCart = (itemId: string, variantName: string) => {
    setCart(prev => prev.filter(c => !(c.itemId === itemId && c.variantName === variantName)));
    triggerNotification("Item removed from basket.");
  };

  const handleModifyCartQty = (itemId: string, variantName: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.itemId === itemId && c.variantName === variantName);
      if (!existing) return prev;
      
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter(c => !(c.itemId === itemId && c.variantName === variantName));
      }
      
      return prev.map(c => 
        (c.itemId === itemId && c.variantName === variantName)
          ? { ...c, quantity: newQty }
          : c
      );
    });
  };

  return (
    <div className={`min-h-[100dvh] bg-[#0c0e12] overflow-y-auto ${cart.length > 0 ? "pb-[380px]" : "pb-24"} flex flex-col font-sans select-none text-white relative`}>
      
      {/* Floating Back Button */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-[100]">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-red-500/20 hover:border-red-500/50 bg-black/85 flex items-center justify-center transition-all hover:bg-zinc-900 text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer group"
          title="Go Back"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform stroke-[2.5]" />
        </button>
      </div>

      {/* HEADER SECTION (New Style) */}
      <div className="relative border-b border-[#1b1e25] pb-4 pt-4 flex flex-col items-center justify-center text-center bg-[#0c0e12]/92 backdrop-blur-md sticky top-0 z-30 gap-3 overflow-hidden">
        {/* Sales representation background graphic texture */}
        <div className="absolute inset-x-0 inset-y-0 w-full h-full opacity-40 pointer-events-none z-0 mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1614680376593-902f74fa0d41?auto=format&fit=crop&w=1200&q=80" 
            alt="Sales POS background matrix" 
            className="w-full h-full object-cover filter blur-[2px]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c0e12]/60 z-0 pointer-events-none" />

        {/* Centered Title Lockup */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2 relative z-10">
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
                fontSize: '28px',
                lineHeight: '1.1',
                marginLeft: '0px',
                marginTop: '0px'
              }}
            >
              POS Checkout
            </h1>
          </motion.div>
          <p 
            className="text-[10px] text-zinc-400 font-mono tracking-wide max-w-[320px] mx-auto leading-relaxed text-center"
            style={{ marginTop: '-4px', fontSize: '10px' }}
          >
            Unified point-of-sale console. Instantly calculate item totals, process cash or digital payment methods, and push live sales metrics straight to the cloud database.
          </p>
          <div className="text-[10px] text-[#00ffcc] font-mono tracking-widest uppercase mt-0.5">
            [ PROFILE AUTH: {activeBandName ? activeBandName.toUpperCase() : "VIRULENT EXCISION"} ]
          </div>
        </div>
      </div>

      {/* High-Priority Critical Stock Alert Banner */}
      {inventory && inventory.filter(item => item.status === 'Critical').length > 0 && (
        <div className="mx-5 mt-4 text-[10.5px] p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 flex flex-col gap-1.5 shadow-lg shadow-red-500/5">
          {inventory.filter(item => item.status === 'Critical').map((item, idx) => (
            <button
              key={item.id ? `crit-${item.id}-${idx}` : `crit-${idx}`}
              onClick={() => onOpenTransferModal && onOpenTransferModal(item.id)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 hover:border-red-400/50 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-red-400 font-mono font-black tracking-widest text-[9px] uppercase leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block shrink-0" />
                <span>CRITICAL INVENTORY ALERT: [{item?.name.toUpperCase()}] STOCK LOW</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] bg-red-500/20 text-red-300 font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border border-red-500/30 group-hover:bg-red-500 group-hover:text-white transition-all">
                  QUICK-RESTOCK FROM VAN 🚚
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isPastShowCutoff && (
        <button 
          onClick={() => activeShow && onSettleShow && onSettleShow(activeShow.id)}
          className="mx-5 mt-4 text-[10.5px] py-2 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/35 hover:border-amber-400 transition-all flex items-center justify-between gap-3 shadow-md shadow-amber-500/5 text-left w-[calc(100%-40px)] group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-sans font-medium text-amber-400 text-[10.5px] truncate">
              Past 4:00 AM cutoff for ({activeShow?.date || 'this show'}). Settle/close cash drawer soon.
            </span>
          </div>
          <span className="text-[8px] bg-amber-500/20 text-amber-300 font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-black transition-all shrink-0">
            SETTLE 💰
          </span>
        </button>
      )}

      {/* SHOW SELECTOR (Matching screenshot) */}
      <div className="px-5 py-3.5 bg-[#0a0c10] border-b border-zinc-900/40 flex flex-col gap-2">
        <div className="flex flex-col">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider font-display">
            Active Campaign Show
          </label>
          <span className="text-[9px] font-mono text-zinc-550 font-medium tracking-wide">
            Pick the show you are sellling at
          </span>
        </div>
        <div className="relative w-full">
          <button 
            onClick={() => setIsShowDropdownOpen(!isShowDropdownOpen)}
            className="w-full bg-[#13161d] border border-zinc-850 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-md text-left active:border-zinc-700 transition-all cursor-pointer"
            id="campaign-location-dropdown-toggle"
          >
            <div className="flex items-center gap-2.5 flex-grow min-w-0">
              <Calendar className="w-4 h-4 text-[#00ffcc] shrink-0" />
              <div className="truncate">
                <p className="text-[11px] font-bold text-white uppercase tracking-wider truncate">
                  {activeShow ? activeShow.festival_name || activeShow.name : 'Select Active Venue'}
                </p>
                <div className="text-[8px] font-mono text-zinc-455 tracking-wide mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{activeShow ? new Date(activeShow.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No dates scheduled'}</span>
                  {activeShow && (activeShow.city || activeShow.venue_address) && (
                    <span className="text-zinc-500 font-bold">• 📍 {activeShow.city || activeShow.venue_address}</span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0" />
          </button>

          {/* Real dropdown items overlay list */}
          <AnimatePresence>
            {isShowDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 right-0 mt-1 z-40 bg-[#13161d] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto"
              >
                {shows.map((s, idx) => (
                  <button
                    key={s.id ? `show-drop-${s.id}-${idx}` : `show-drop-${idx}`}
                    onClick={() => {
                      setSelectedShowId(s.id);
                      setIsShowDropdownOpen(false);
                      addLog(`Campaign checkout location swapped to: ${s.name}`);
                    }}
                    className={`w-full p-3 text-left border-b border-zinc-850/60 last:border-b-0 flex flex-col justify-center hover:bg-zinc-800 transition-colors ${
                      selectedShowId === s.id ? 'bg-[#1a202c]/50 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-bold text-white uppercase tracking-wider truncate">{s.festival_name || s.name}</span>
                      <span className="text-[8px] font-mono text-[#00ffcc] shrink-0">{s.date}</span>
                    </div>
                    {(s.city || s.venue_address) && (
                      <span className="text-[8.5px] font-mono text-zinc-500 mt-1 truncate block">
                        📍 {s.city || s.venue_address}
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="px-5 pb-3.5 flex flex-col gap-2.5 bg-[#080a0e] pt-1 w-full">
        {onOpenCashDrawer && (
          <motion.button 
            type="button"
            onClick={onOpenCashDrawer}
            className="w-full bg-[#0d1f1a]/95 border border-[#00ffcc]/50 hover:border-[#33ffdd] text-zinc-100 p-3 rounded-xl flex items-center justify-start gap-3.5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            animate={{
              boxShadow: [
                "0 0 8px rgba(0, 255, 204, 0.15)",
                "0 0 22px rgba(0, 255, 204, 0.45)",
                "0 0 8px rgba(0, 255, 204, 0.15)"
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all pointer-events-none" />
            <div className="w-8.5 h-8.5 rounded-lg bg-[#00ffcc]/15 flex items-center justify-center shrink-0 border border-[#00ffcc]/20 group-hover:bg-[#00ffcc]/25 transition-colors">
              <Coins className="w-4 h-4 text-[#00ffcc]" />
            </div>
            <div className="text-left flex flex-col justify-center">
              <span className="text-[11px] font-mono uppercase font-black tracking-wider text-[#00ffcc] transition-colors flex items-center gap-1.5 leading-none">
                Access Cash Drawer Audit System
                <span className="text-[7.5px] bg-[#00ffcc]/15 text-[#00ffcc] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded leading-none">Drawer</span>
              </span>
              <span className="text-[9.5px] text-zinc-400 font-sans mt-0.5 leading-normal">
                Easily audit cash on hand, quickly set starting bank, or record payouts and expenses
              </span>
            </div>
          </motion.button>
        )}

        <motion.button 
          onClick={() => onOpenTransferModal()}
          className="w-full bg-[#111319]/90 border border-emerald-500/35 hover:border-emerald-400 text-zinc-100 p-3 rounded-xl flex items-center justify-start gap-3.5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          animate={{
            boxShadow: [
              "0 0 6px rgba(16, 185, 129, 0.12)",
              "0 0 16px rgba(16, 185, 129, 0.28)",
              "0 0 6px rgba(16, 185, 129, 0.12)"
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
            <ArrowRightLeft className="w-4 h-4 text-[#00ffcc]" />
          </div>
          <div className="text-left flex flex-col justify-center">
            <span className="text-[11px] font-mono uppercase font-black tracking-wider text-[#00ffcc] transition-colors">
              Restock the Merch Table
            </span>
            <span className="text-[9.5px] text-zinc-400 font-sans mt-0.5 leading-normal">
              Click here to restock your items to sell
            </span>
          </div>
        </motion.button>

        <motion.button 
          onClick={() => setIsBundleModalOpen(true)}
          className="w-full bg-gradient-to-r from-purple-950/20 to-blue-950/20 border border-purple-500/40 hover:border-purple-400 text-zinc-100 p-3 rounded-xl flex items-center justify-start gap-3.5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          animate={{
            boxShadow: [
              "0 0 6px rgba(168, 85, 247, 0.12)",
              "0 0 16px rgba(168, 85, 247, 0.28)",
              "0 0 6px rgba(168, 85, 247, 0.12)"
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
            <PackagePlus className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left flex flex-col justify-center">
            <span className="text-[11px] font-mono uppercase font-black tracking-wider text-purple-300 transition-colors">
              Create a Bundle
            </span>
            <span className="text-[9.5px] text-zinc-400 font-sans mt-0.5 leading-normal">
              Sell two or more items together for one price
            </span>
          </div>
        </motion.button>
      </div>

      {/* FILTER CATEGORY HORIZONTAL BAR (Matching screenshot visual styling) */}
      <div className="px-5 py-3.5 flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap bg-[#080a0e] pt-0">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-[#00ffcc] text-black shadow-lg shadow-[#00ffcc]/10'
              : 'border border-[#1f2330] text-zinc-500 hover:text-white'
          }`}
        >
          All Items
        </button>

        <button
          onClick={() => setSelectedCategory('APPAREL')}
          className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
            selectedCategory === 'APPAREL'
              ? 'bg-[#fcd34d] text-black border-transparent font-bold shadow-lg shadow-[#fcd34d]/10'
              : 'border-zinc-800 hover:border-[#fcd34d]/50 text-[#fcd34d]/80 hover:text-white'
          }`}
        >
          Apparel
        </button>

        <button
          onClick={() => setSelectedCategory('MEDIA')}
          className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
            selectedCategory === 'MEDIA'
              ? 'bg-[#c084fc] text-black border-transparent font-bold shadow-lg shadow-[#c084fc]/10'
              : 'border-zinc-800 hover:border-[#c084fc]/50 text-[#c084fc]/80 hover:text-white'
          }`}
        >
          Vinyl / Media
        </button>

        <button
          onClick={() => setSelectedCategory('ACCESSORIES')}
          className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
            selectedCategory === 'ACCESSORIES'
              ? 'bg-[#2dd4bf] text-black border-transparent font-bold shadow-lg shadow-[#2dd4bf]/10'
              : 'border-zinc-800 hover:border-[#2dd4bf]/50 text-[#2dd4bf]/80 hover:text-white'
          }`}
        >
          Stickers & Patches
        </button>
      </div>

      {/* RENDER PRODUCTS GRID BLOCK */}
      <div className="px-5 space-y-4 pt-1">
        {filteredInventory.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center text-center p-5">
            <AlertTriangle className="w-8 h-8 text-amber-500 mb-2 animate-pulse" />
            <p className="text-xs text-zinc-400 font-mono">No inventory records matching active filter</p>
          </div>
        ) : (
          <>
            {/* GIANT FEATURED CARD (Matches top of screenshot) */}
            {featuredProduct && (
              <div 
                className="bg-[#111319] border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.01]"
                id={`featured-${featuredProduct.id}`}
              >
                {/* Visual Image container banner style */}
                <div className="relative h-64 bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-900/60">
                  <div className="absolute inset-0 bg-black/20 z-0" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0e1015] to-transparent z-10" />
                  
                  {/* Featured Badge */}
                  <span className="absolute top-4 left-4 bg-[#0fd9ae] text-black text-[9px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded flex items-center gap-1.5 shadow-md z-20">
                    ★ FEATURED
                  </span>

                  {/* Price Tag */}
                  <span className="absolute top-4 right-4 bg-[#1a1d26]/85 border border-zinc-800 text-[#00ffcc] font-mono font-bold text-xs px-3 py-1 rounded-lg z-20">
                    ${featuredProduct.price.toFixed(0)}
                  </span>

                  {/* Graphic Product image */}
                  <img 
                    src={featuredProduct.image_url} 
                    alt={featuredProduct.name} 
                    className="absolute inset-0 w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500 opacity-90"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Info and action button */}
                <div className="p-4.5 space-y-3.5 bg-[#0e1015] relative z-20">
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-white font-display uppercase">
                      {featuredProduct.name}
                    </h3>

                    {/* Dynamic Variant info line */}
                    <div className="flex items-center gap-1 mt-1 font-mono text-[10px] text-zinc-500 overflow-x-auto whitespace-nowrap">
                      {getVariantsForProduct(featuredProduct).map((v, idx, arr) => {
                        const isSoldOut = v.stock === 0;
                        return (
                          <span key={`variant-${v.name}-${idx}`} className="flex items-center gap-1">
                            <span className={isSoldOut ? 'text-red-500 line-through font-semibold' : 'text-[#00ffcc] font-medium'}>
                              {v.name}
                            </span>
                            {idx < arr.length - 1 && <span className="text-zinc-700 font-bold">,</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add To Cart Big Neon button */}
                  {getVariantsForProduct(featuredProduct).length === 1 ? (
                    (() => {
                      const singleVariant = getVariantsForProduct(featuredProduct)[0];
                      const cartItem = cart.find(c => c.itemId === featuredProduct.id && c.variantName === singleVariant.name);
                      const cartQty = cartItem ? cartItem.quantity : 0;
                      
                      return cartQty > 0 ? (
                        <div className="w-full flex relative items-center justify-between rounded-xl overflow-hidden border border-[#00ffcc]/40 bg-[#0e1015] h-11 transition-all shadow-lg shadow-[#00ffcc]/10">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleModifyCartQty(featuredProduct.id, singleVariant.name, -1); }}
                            className="h-full w-14 flex items-center justify-center text-[#00ffcc] hover:text-white bg-[#13161d] hover:bg-[#1a1d26] transition-colors cursor-pointer border-r border-[#00ffcc]/40"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm flex-1 text-center font-mono text-[#00ffcc] font-black">{cartQty} ADDED</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleItemClick(featuredProduct); }}
                            className="h-full w-14 flex items-center justify-center text-[#00ffcc] hover:text-white bg-[#13161d] hover:bg-[#1a1d26] transition-colors cursor-pointer border-l border-[#00ffcc]/40"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleItemClick(featuredProduct)}
                          className="w-full py-3 bg-gradient-to-tr from-[#00ffd2] to-[#12b295] hover:to-[#57ffd9] text-black font-sans font-bold uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all shadow-lg shadow-[#00ffcc]/10 cursor-pointer"
                        >
                          + Add to Basket
                        </button>
                      );
                    })()
                  ) : (
                    <button
                      onClick={() => handleItemClick(featuredProduct)}
                      className="w-full py-3 bg-gradient-to-tr from-[#00ffd2] to-[#12b295] hover:to-[#57ffd9] text-black font-sans font-bold uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all shadow-lg shadow-[#00ffcc]/10 cursor-pointer"
                    >
                      Select Size Options
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TWO COLUMN GRID BELOW */}
            {gridProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pb-6">
                {gridProducts.map((product, idx) => {
                  const variants = getVariantsForProduct(product);
                  const totalLiveQty = variants.reduce((sum, v) => sum + v.stock, 0);
                  const isLow = totalLiveQty <= 10;
                  
                  return (
                    <div 
                      key={product.id ? `grid-prod-${product.id}-${idx}` : `grid-prod-${idx}`}
                      className="bg-[#111319] border border-zinc-850/80 rounded-xl overflow-hidden flex flex-col justify-between shadow-lg"
                    >
                      {/* Grid Item Photo Section */}
                      <div className="relative h-40 bg-zinc-950 flex items-center justify-center p-0 border-b border-zinc-900/40 overflow-hidden group">
                        {isLow && (
                          <span className="absolute top-2 left-2 z-10 bg-red-950/90 backdrop-blur-sm text-red-500 border border-red-900 text-[8px] font-mono uppercase font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md">
                            ⚠️ Low
                          </span>
                        )}

                        <span className="absolute top-2 right-2 z-10 bg-black/80 backdrop-blur border border-zinc-800 text-[#00ffcc] font-mono font-bold text-xs px-2 py-0.5 rounded-md shadow-md">
                          ${product.price.toFixed(0)}
                        </span>

                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover filter brightness-[0.80] group-hover:brightness-100 group-hover:scale-105 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Info & action block */}
                      <div className="p-3 flex flex-col justify-between flex-grow space-y-2.5 bg-[#0e1015]">
                        <div className="min-h-[46px]">
                          <h4 className="text-[11px] font-bold tracking-wide text-white uppercase font-display line-clamp-2">
                            {product.name}
                          </h4>
                          
                          {/* Sizes / Subtext */}
                          <p className="text-[8px] font-mono text-zinc-500 mt-1 uppercase tracking-wide truncate">
                            {product.item_type === 'CD' || product.item_type === 'Vinyl' 
                              ? product.item_type 
                              : variants.map(v => v.name).join(', ')
                            }
                          </p>
                        </div>

                        {/* Button */}
                        <div className="flex items-center gap-1 mt-1">
                          {variants.length === 1 ? (
                            (() => {
                              const singleVariantCartItem = cart.find(c => c.itemId === product.id && c.variantName === variants[0].name);
                              const cartQty = singleVariantCartItem ? singleVariantCartItem.quantity : 0;
                              return (
                                <div className="w-full flex relative items-center justify-between rounded-lg overflow-hidden border border-zinc-900 bg-zinc-950 h-7 transition-all">
                                  {cartQty > 0 ? (
                                    <>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleModifyCartQty(product.id, variants[0].name, -1); }}
                                        className="h-full w-8 flex items-center justify-center text-zinc-400 hover:text-white bg-[#1a1d26] hover:bg-[#252830] transition-colors cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="text-[10px] font-mono text-[#00ffcc] font-black">{cartQty}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleItemClick(product); }}
                                        className="h-full w-8 flex items-center justify-center text-zinc-400 hover:text-[#00ffcc] bg-[#1a1d26] hover:bg-[#252830] transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleItemClick(product)}
                                      className="flex-1 h-full py-1.5 bg-[#00ffcc] hover:bg-[#0fd9ae] text-black font-sans font-bold uppercase text-[9px] tracking-wider flex items-center justify-center transition-all cursor-pointer w-full"
                                    >
                                      + Add
                                    </button>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <button
                              onClick={() => handleItemClick(product)}
                              className="w-full py-1.5 bg-[#1f2330] hover:bg-[#2a3040] text-zinc-300 hover:text-white font-sans font-bold uppercase text-[9px] tracking-wider rounded-lg flex items-center justify-center transition-all cursor-pointer border border-zinc-700"
                            >
                              Select Size
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* PERSISTENT CART COMPONENT */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-full max-w-[490px] z-40 bg-[#0b0d13] border-t border-zinc-800 shadow-[0_-20px_40px_rgba(0,0,0,0.9)] flex flex-col pb-1 sm:pb-3"
          >
            {/* Cart Header & Summary List */}
            <div className="px-5 py-3 max-h-48 overflow-y-auto scrollbar-barely-visible">
              <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#00ffcc] uppercase tracking-widest font-black flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                Basket Contents
              </span>
              <button 
                onClick={() => setCart([])}
                className="text-[9px] font-mono uppercase bg-red-950/30 text-red-400 hover:text-red-300 hover:bg-red-900/50 px-2 py-0.5 rounded transition-colors"
              >
                Clear Cart
              </button>
            </div>
            
            <div className="space-y-1.5">
              {cart.map((c, i) => (
                <div key={`sales-tax-row-${i}`} className="flex items-center justify-between bg-[#13161d] p-1.5 rounded-lg border border-zinc-800/80">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-7 h-7 rounded bg-zinc-900 shrink-0 border border-zinc-800 overflow-hidden">
                      <img src={c.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-white truncate leading-tight uppercase font-display">{c.name}</span>
                      <span className="text-[8px] font-mono text-zinc-500 tracking-wide uppercase">{c.variantName}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-zinc-400">x{c.quantity}</span>
                      <span className="text-[10px] font-mono text-[#00ffcc] font-bold">${(c.price * c.quantity).toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => handleModifyCartQty(c.itemId, c.variantName, -c.quantity)}
                      className="text-zinc-600 hover:text-red-500 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-zinc-800/50 flex items-center justify-between layout-bottom-safety bg-[#0b0d13]">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Total ({cartTotalItemCount} Items)</span>
              <span className="text-xl font-mono text-white font-black">${cartTotalValue.toFixed(0)}</span>
            </div>
            <button
              onClick={() => setIsCheckoutDrawerOpen(true)}
              className="px-8 py-2.5 bg-gradient-to-r from-[#00ffd2] to-[#12b295] hover:brightness-110 text-black font-sans font-bold uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-[#00ffd2]/15 active:scale-95 flex items-center gap-2"
            >
              Checkout <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* BUNDLE CREATOR OVERLAY MODAL */}
      <AnimatePresence>
        {isBundleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-[#0e1015] border border-[#252830] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
              
              <button 
                onClick={() => setIsBundleModalOpen(false)}
                className="absolute top-3.5 right-3.5 text-zinc-500 hover:text-white transition-colors z-20 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-5 flex flex-col min-h-[400px] justify-between relative z-10">
                {/* Title */}
                <div>
                  <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-black block flex items-center gap-1.5"><PackagePlus className="w-3 h-3" /> Bundle Creator</span>
                  <h3 className="text-xs font-bold font-display text-white uppercase tracking-wider mt-0.5 pr-8">
                    Select Items For Promotion
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto my-4 space-y-2 max-h-[300px] pr-2">
                  {filteredInventory.map((item, itemIdx) => {
                    const variants = getVariantsForProduct(item);
                    return variants.map((variant, vIdx) => {
                      const isSelected = (bundleItems || []).some(bi => bi.item.id === item.id && bi.variantName === variant.name);
                      return (
                        <div 
                          key={`bundle-item-${item.id || itemIdx}-${itemIdx}-${variant.name || vIdx}-${vIdx}`}
                          onClick={() => handleToggleBundleItem(item, variant.name)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected ? 'bg-purple-500/10 border-purple-500 text-purple-100' : 'bg-[#111319] border-zinc-800 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold uppercase font-display leading-tight">{item?.name}</span>
                            <span className="text-[9px] font-mono opacity-60">{variant.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </div>
                      );
                    });
                  })}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 overflow-hidden">
                    <span className="text-zinc-500 font-mono text-sm mr-2">$</span>
                    <input
                      type="number"
                      value={bundlePrice}
                      onChange={(e) => setBundlePrice(e.target.value)}
                      placeholder="Bundle total price..."
                      className="bg-transparent border-none text-base font-mono text-white focus:outline-none w-full placeholder:text-zinc-700"
                    />
                  </div>

                  <button
                    onClick={handleConfirmBundle}
                    className="w-full py-3.5 bg-gradient-to-tr from-purple-500 to-indigo-500 hover:brightness-110 text-white font-sans font-bold uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all outline-none"
                  >
                    Add Bundle To Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIZE / VARIANT PICKER MODAL POPUP (Matching second screenshot design meticulously) */}
      <AnimatePresence>
        {pickerItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-[#0b0d13] border-2 border-[#1f2330] rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl relative"
              id="size-variant-picker-modal"
            >
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00ffcc_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
              
              {/* Close Button UI upper right */}
              <button 
                onClick={() => setPickerItem(null)}
                className="absolute top-4 right-4 text-red-500 hover:text-white bg-[#100305]/80 border border-red-800 rounded-lg p-1 transition-colors z-50 cursor-pointer"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>

              <div className="p-5 flex flex-col min-h-[300px] justify-between relative z-10">
                {/* Title */}
                <div>
                  <span className="text-[8px] font-mono text-[#00ffcc] uppercase tracking-widest font-black block">Live Stock Panel</span>
                  <h3 className="text-xs font-bold font-display text-white uppercase tracking-wider mt-0.5 pr-8">
                    {pickerItem.name}
                  </h3>
                </div>

                {/* Body: Variants List */}
                <div className="space-y-2 py-4">
                  {getVariantsForProduct(pickerItem).map((variant, index) => {
                    const activeQty = quantitiesState[variant.name] || 0;
                    const isSoldOut = variant.stock === 0;

                    return (
                      <div key={`sales-stat-${index}`} className="flex items-center justify-between gap-3 text-sm py-1">
                        
                        {/* 1. Decrement / Increment group */}
                        <div className="flex items-center gap-1.5 bg-[#12151e]/90 border border-zinc-800 rounded-lg p-1 text-center font-mono">
                          <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => handleModifyModalQty(variant.name, -1, variant.stock)}
                            className={`w-5 h-5 flex items-center justify-center rounded transition-colors text-xs ${
                              isSoldOut ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-800 text-zinc-400 cursor-pointer'
                            }`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          <span className={`w-5 text-center text-xs font-black ${activeQty > 0 ? 'text-[#00ffcc]' : 'text-zinc-500'}`}>
                            {activeQty}
                          </span>

                          <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => handleModifyModalQty(variant.name, 1, variant.stock)}
                            className={`w-5 h-5 flex items-center justify-center rounded transition-colors text-xs ${
                              isSoldOut ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#00ffcc]/20 text-[#00ffcc] cursor-pointer'
                            }`}
                          >
                            <Plus className="w-3 h-3 text-[#00ffcc]" />
                          </button>
                        </div>

                        {/* 2. Size Button tag (Matches exact style in screenshot) */}
                        <div className="flex-grow">
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-mono border uppercase tracking-wider ${
                            isSoldOut 
                              ? 'border-red-950/60 bg-red-950/15 text-red-500/50 line-through' 
                              : activeQty > 0 
                                ? 'border-[#fcd34d] text-[#fcd34d] bg-[#fcd34d]/5 font-black' 
                                : 'border-zinc-850 bg-zinc-900 text-zinc-350'
                          }`}>
                            {variant.name}
                          </span>
                        </div>

                        {/* 3. Availability Text */}
                        <div className="text-right shrink-0">
                          {isSoldOut ? (
                            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest bg-red-950/20 px-1.5 py-0.5 rounded border border-red-950">
                              Sold Out!
                            </span>
                          ) : (
                            <span className={`text-[10px] font-mono ${variant.stock <= 5 ? 'text-amber-400 font-bold animate-pulse' : 'text-zinc-400'}`}>
                              {variant.stock} Left
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Footer Solid button */}
                <button
                  type="button"
                  onClick={handleConfirmVariants}
                  className="w-full py-2.5 bg-[#00ffcc] hover:bg-[#0fd9ae] text-black font-mono font-bold uppercase text-[10px] tracking-widest rounded-lg flex items-center justify-center shadow-lg cursor-pointer mt-1"
                >
                  SELECT SIZES
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED CHECKOUT AND PAYMENT TYPE SLIDE DRAWER */}
      <AnimatePresence>
        {isCheckoutDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#0b0d13] border-t-2 border-zinc-800 rounded-t-3xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl overflow-hidden pb-8"
              id="payment-checkout-drawer"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-zinc-900 flex justify-between items-center bg-[#07080a]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#00ffcc]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-display">
                    Basket Summary / Checkout
                  </h3>
                </div>
                <button 
                  onClick={() => setIsCheckoutDrawerOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-grow overflow-y-auto p-5 pb-20 space-y-6">

                {/* Sales Representative Selector */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase text-amber-500 tracking-widest flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-500" /> SALES REPRESENTATIVE
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'team-1', name: 'Sarah', label: 'Rep' },
                      { id: 'team-2', name: 'Alex', label: 'TM' },
                      { id: 'team-3', name: 'General', label: 'Split' },
                    ].map((rep, rIdx) => (
                      <button
                        key={`rep-${rep.id}-${rIdx}`}
                        type="button"
                        onClick={() => setSelectedTeamMemberId(rep.id)}
                        className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedTeamMemberId === rep.id
                            ? 'bg-amber-500/10 border-amber-500/80 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                            : 'bg-[#111319]/90 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px] truncate leading-tight font-sans">{rep.name}</div>
                        <div className="text-[8.5px] font-mono opacity-60 truncate mt-0.5">{rep.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 1. Order Summary Items */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase text-[#00ffcc] tracking-widest flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5" /> ORDER SUMMARY
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-barely-visible">
                    {cart.map((cartItem, idx) => (
                      <div key={`${cartItem.itemId}-${cartItem.variantName}-${idx}`} className="bg-[#111319] border border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={cartItem.image_url} className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 object-cover shrink-0" referrerPolicy="no-referrer" />
                          <div className="flex flex-col truncate">
                            <span className="text-[11px] font-bold text-white font-display truncate leading-tight">{cartItem.name} ({cartItem.variantName})</span>
                            <span className="text-[10px] font-mono text-zinc-400 mt-1">Qty: {cartItem.quantity} • ${(cartItem.price).toFixed(2)} ea</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] font-mono font-bold text-white">${(cartItem.price * cartItem.quantity).toFixed(2)}</span>
                          <button 
                            onClick={() => handleRemoveFromCart(cartItem.itemId, cartItem.variantName)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Order Adjustments */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddSalesTax(!addSalesTax)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        addSalesTax 
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' 
                          : 'bg-[#111319]/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider font-display">Sales Tax</span>
                        <span className="text-[8px] font-mono opacity-80 mt-0.5">8.5% local</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center shrink-0 ${addSalesTax ? 'border-blue-400 bg-blue-500' : 'border-zinc-750'}`}>
                        {addSalesTax && <div className="w-1.5 h-1.5 rounded-full bg-white animate-scale-in" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsGiveaway(!isGiveaway)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isGiveaway 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-[#00ffcc]' 
                          : 'bg-[#111319]/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider font-display">Giveaway</span>
                        <span className="text-[8px] font-mono opacity-80 mt-0.5">Zero due</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center shrink-0 ${isGiveaway ? 'border-[#00ffcc] bg-[#00ffcc]' : 'border-zinc-750'}`}>
                        {isGiveaway && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                      </div>
                    </button>
                  </div>

                  <div className="bg-[#111319]/90 border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold text-zinc-300 font-display uppercase tracking-wider">Apply Discount</span>
                      <span className="text-[8px] font-mono text-zinc-500 mt-0.5">Custom reduction</span>
                    </div>
                    <div className="flex items-center gap-1.5 border border-zinc-800 bg-black/45 rounded-lg px-2 py-1 min-w-0 max-w-[150px] shrink-0">
                      <input 
                        type="number" 
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent border-none text-xs font-mono text-right text-white focus:outline-none w-full placeholder-zinc-850"
                      />
                      <div className="flex bg-zinc-900 rounded-md overflow-hidden border border-zinc-800 shrink-0">
                        <button 
                          type="button"
                          onClick={() => setDiscountType('$')}
                          className={`px-1.5 py-0.5 text-[9px] font-mono font-bold transition-colors cursor-pointer ${discountType === '$' ? 'bg-blue-500 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                          $
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDiscountType('%')}
                          className={`px-1.5 py-0.5 text-[9px] font-mono font-bold transition-colors cursor-pointer ${discountType === '%' ? 'bg-blue-500 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                          %
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TIPPING SECTION: SUPPORT THE CREW */}
                  <div className="bg-[#15191f]/95 border border-zinc-800/80 p-3 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-bold text-[#00ffcc] font-display uppercase tracking-wider">Add Tip (Optional)</span>
                        <span className="text-[8px] font-mono text-zinc-500 mt-0.5">Direct merchant gratitude</span>
                      </div>
                      {calculatedTipAmount > 0 && (
                        <span className="text-[10px] font-mono font-bold text-[#00ffcc] bg-[#00ffcc]/10 px-2 py-0.5 rounded-lg">
                          +${calculatedTipAmount.toFixed(0)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { label: 'None', value: 'none' },
                        { label: '10%', value: '10%' },
                        { label: '15%', value: '15%' },
                        { label: '20%', value: '20%' },
                        { label: 'Custom', value: 'custom' }
                      ].map((opt, optIdx) => (
                        <button
                          key={`tip-opt-${opt.value}-${optIdx}`}
                          type="button"
                          onClick={() => {
                            setTipType(opt.value as any);
                            if (opt.value !== 'custom') setCustomTipValue('');
                          }}
                          className={`py-1.5 px-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                            tipType === opt.value
                              ? 'bg-[#00ffcc] text-black shadow-lg shadow-[#00ffcc]/15'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {tipType === 'custom' && (
                      <div className="flex items-center gap-2 border border-zinc-800 bg-black/45 rounded-lg px-2.5 py-1.5">
                        <span className="text-[10px] font-mono text-zinc-500 font-bold">$</span>
                        <input
                          type="number"
                          value={customTipValue}
                          onChange={(e) => setCustomTipValue(e.target.value)}
                          placeholder="Enter tip"
                          className="bg-transparent border-none text-xs font-mono text-white focus:outline-none w-full"
                          min="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* 2.5 CUSTOMER LOYALTY CARD DISCOUNT INTEGRATION */}
                  <div className="bg-[#1c122e]/40 border border-purple-900/50 p-4 rounded-xl space-y-3 transition-colors duration-200">
                    <button
                      type="button"
                      onClick={() => setIsLoyaltyExpanded(!isLoyaltyExpanded)}
                      className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-purple-400 font-bold" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-purple-300 font-display uppercase tracking-wider">
                            VIP Loyalty Checkout
                          </span>
                          {!isLoyaltyExpanded && (
                            <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
                              {appliedLoyaltyMember 
                                ? `Active: ${appliedLoyaltyMember.name} (${appliedLoyaltyDiscountType === 'signup' ? '20%' : '10%'} Off)`
                                : 'Tap to expand member lookup / voucher'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {appliedLoyaltyMember && !isLoyaltyExpanded && (
                          <span className="bg-[#00ffcc]/10 border border-[#00ffcc]/20 text-[#00ffcc] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                            Applied
                          </span>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-purple-400 transition-transform duration-200 ${isLoyaltyExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isLoyaltyExpanded && (
                      <div className="pt-2 border-t border-purple-950/30 space-y-3">
                        {!appliedLoyaltyMember ? (
                          <div className="space-y-3 font-mono text-[10px]">
                            
                            {/* Selector/Phone query inputs */}
                            <div className="space-y-2">
                              <p className="text-[9px] text-zinc-400 font-sans leading-none">
                                Enter the member's details or their printed loyalty card's promo code:
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="tel"
                                  value={loyaltySearchPhone}
                                  onChange={(e) => setLoyaltySearchPhone(e.target.value.replace(/\D/g, ''))}
                                  placeholder="Phone Lookup"
                                  className="w-full bg-black/40 border border-purple-950 p-2 rounded text-[10px] text-white focus:outline-none focus:border-purple-500 text-center"
                                />
                                <input
                                  type="text"
                                  maxLength={4}
                                  value={loyaltySearchPin}
                                  onChange={(e) => setLoyaltySearchPin(e.target.value.replace(/\D/g, ''))}
                                  placeholder="4-Digit PIN"
                                  className="w-full bg-black/40 border border-purple-950 p-2 rounded text-[10px] text-white focus:outline-none focus:border-purple-500 text-center"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const cleanPhone = loyaltySearchPhone.replace(/\D/g, '');
                                  if (!cleanPhone || loyaltySearchPin.length !== 4) {
                                    triggerNotification('Enter phone and 4-digit PIN first!');
                                    return;
                                  }
                                  const matched = loyaltyMembers.find(m => m.phone === cleanPhone && m.pin === loyaltySearchPin);
                                  if (matched) {
                                    setAppliedLoyaltyMember(matched);
                                    setAppliedLoyaltyDiscountType('lifetime');
                                    triggerNotification(`⭐ 10% Lifetime VIP discount active for ${matched.name}!`);
                                    addLog(`Applied 10% lifetime VIP discount at checkout for ${matched.name}`);
                                  } else {
                                    triggerNotification('No matching registered VIP profile found!');
                                  }
                                }}
                                className="w-full bg-purple-900/35 hover:bg-purple-900/50 border border-purple-800 text-purple-200 py-1.5 rounded text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                              >
                                Verify & Apply 10% Lifetime OFF
                              </button>
                            </div>

                            {/* Promo / barcode vouchers integration */}
                            <div className="space-y-2 pt-2 border-t border-purple-950/50">
                              <p className="text-[9px] text-zinc-400 font-sans leading-none">
                                OR Scan/Enter 20% Off Sign-up Voucher Code:
                              </p>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={loyaltyPromoInput}
                                  onChange={(e) => setLoyaltyPromoInput(e.target.value)}
                                  placeholder="e.g. VIP20-SARAH-1984"
                                  className="flex-grow bg-black/40 border border-purple-950 p-2 rounded text-[10px] text-white focus:outline-none focus:border-purple-500 uppercase font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const code = loyaltyPromoInput.toUpperCase().trim();
                                    if (!code.startsWith('VIP20-')) {
                                      triggerNotification('Invalid coupon pattern. Code must start with VIP20-');
                                      return;
                                    }
                                    const parts = code.split('-');
                                    if (parts.length < 3) {
                                      triggerNotification('Format error! Try e.g. VIP20-SARAH-1984');
                                      return;
                                    }
                                    const checkName = parts[1];
                                    const checkSuffix = parts[2];

                                    const matched = loyaltyMembers.find(m => 
                                      m.name.toUpperCase().includes(checkName) && 
                                      (m.pin === checkSuffix || checkSuffix.length === 4)
                                    );

                                    if (matched) {
                                      setAppliedLoyaltyMember(matched);
                                      setAppliedLoyaltyDiscountType('signup');
                                      triggerNotification(`🎫 20% Instant discount active for member ${matched.name}!`);
                                      addLog(`Applied 20% signup discount at checkout for ${matched.name}`);
                                    } else {
                                      const fallback = loyaltyMembers.find(m => m.name.toUpperCase().includes(checkName));
                                      if (fallback) {
                                        setAppliedLoyaltyMember(fallback);
                                        setAppliedLoyaltyDiscountType('signup');
                                        triggerNotification(`🎫 20% Instant discount active for member ${fallback.name}!`);
                                        addLog(`Applied 20% signup discount boundary match for ${fallback.name}`);
                                      } else {
                                        triggerNotification('Voucher not validated or member not in register!');
                                      }
                                    }
                                  }}
                                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 cursor-pointer"
                                >
                                  Verify
                                </button>
                              </div>
                            </div>

                            {/* Interactive scan simulators selector */}
                            {loyaltyMembers.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-purple-950/50">
                                <p className="text-[8.5px] text-zinc-500 font-sans leading-none">
                                  Table scanner simulation (Tap registered VIP card to replicate scan):
                                </p>
                                <div className="grid grid-cols-2 gap-1.5 max-h-20 overflow-y-auto pr-1">
                                  {loyaltyMembers.map((m, idx) => (
                                    <button
                                      key={m.id ? `loyalty-${m.id}-${idx}` : `loyalty-${idx}`}
                                      type="button"
                                      onClick={() => {
                                        setAppliedLoyaltyMember(m);
                                        setAppliedLoyaltyDiscountType('lifetime');
                                        triggerNotification(`⚡ scanned QR Code card of VIP member '${m.name}'!`);
                                        addLog(`Checkout scanner matched 10% customer card: ${m.name}`);
                                      }}
                                      className="py-1 px-1.5 bg-black/50 border border-zinc-850 hover:border-purple-900 rounded text-[9px] text-zinc-400 hover:text-purple-300 transition text-left truncate block cursor-pointer"
                                    >
                                      🏷️ {m.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        ) : (
                          <div className="bg-purple-950/30 border border-purple-900 p-3 rounded-xl flex items-center justify-between text-[10px] font-mono">
                            <div className="space-y-1">
                              <span className="text-zinc-500 block uppercase font-bold">Applied VIP Account</span>
                              <span className="text-sm font-black text-white block uppercase leading-none">{appliedLoyaltyMember.name}</span>
                              <span className="text-purple-300 block font-bold">
                                {appliedLoyaltyDiscountType === 'signup' ? '🔥 20% off signup voucher' : '⭐ 10% lifetime VIP discount'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedLoyaltyMember(null);
                                setAppliedLoyaltyDiscountType('none');
                                triggerNotification('Loyalty VIP benefits removed');
                              }}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded text-[9px] uppercase font-bold tracking-wider font-mono border border-red-950/50 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Payment Method block */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
                        paymentMethod === 'CASH'
                          ? 'bg-[#181d26] border-[#00ffcc] text-[#00ffcc]'
                          : 'bg-[#111319]/80 border-zinc-850 text-emerald-500/50 hover:border-[#00ffcc]/50 hover:text-[#00ffcc]'
                      }`}
                    >
                      <Coins className="w-6 h-6" />
                      <span className="text-[11px] font-display font-bold uppercase tracking-wider">CASH</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
                        paymentMethod === 'CARD'
                          ? 'bg-[#181d26] border-[#00ffcc] text-zinc-100'
                          : 'bg-[#111319]/80 border-[#252830] text-zinc-400 hover:border-zinc-500 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="text-[11px] font-display font-bold uppercase tracking-wider">CARD</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PAYPAL')}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                        paymentMethod === 'PAYPAL'
                          ? 'bg-amber-950/20 border-amber-500/80 text-white'
                          : 'bg-[#111319]/80 border-[#252830] text-zinc-400 hover:border-zinc-500 hover:text-white'
                      }`}
                    >
                      <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-display font-bold uppercase text-white">PayPal</span>
                        <span className="text-[9px] font-mono text-amber-500/80">Live Smart Pay</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QR')}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                        paymentMethod === 'QR'
                          ? 'bg-emerald-950/20 border-emerald-500/80 text-white'
                          : 'bg-[#111319]/80 border-[#252830] text-zinc-400 hover:border-zinc-500 hover:text-white'
                      }`}
                    >
                      <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-display font-bold uppercase text-white">Cash App</span>
                        <span className="text-[9px] font-mono text-emerald-400/80">Scan & Pay</span>
                      </div>
                    </button>
                  </div>

                  {/* Cash Quick Options */}
                  <AnimatePresence>
                    {paymentMethod === 'CASH' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#111319]/80 border border-zinc-800 rounded-xl p-3 mt-2 flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Cash Received</span>
                          <div className="grid grid-cols-4 gap-2">
                            {['exact', '20', '50', '100'].map((opt, optIdx) => (
                              <button
                                key={`cash-opt-${opt}-${optIdx}`}
                                onClick={() => setCashGivenOption(opt as any)}
                                className={`py-2 px-1 text-[11px] font-mono rounded-lg transition-colors border ${
                                  cashGivenOption === opt
                                    ? 'bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc]'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                              >
                                {opt === 'exact' ? 'Exact' : `$${opt}`}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                                onClick={() => setCashGivenOption('custom')}
                                className={`py-2 px-3 text-[11px] font-mono rounded-lg transition-colors border flex-shrink-0 ${
                                  cashGivenOption === 'custom'
                                    ? 'bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc]'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                            >
                              Custom
                            </button>
                            {cashGivenOption === 'custom' && (
                              <div className="flex items-center gap-1 bg-zinc-900 border border-[#00ffcc]/50 rounded-lg px-2 flex-grow overflow-hidden">
                                <span className="text-zinc-500 font-mono text-sm">$</span>
                                <input
                                  type="number"
                                  value={customCashValue}
                                  onChange={(e) => setCustomCashValue(e.target.value)}
                                  placeholder="0.00"
                                  className="bg-transparent border-none text-sm font-mono text-white focus:outline-none w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. Order Total block */}
                <div className="bg-[#0e1015] border border-zinc-900 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#00ffcc] tracking-widest flex items-center gap-2 border-b border-zinc-800/80 pb-2 mb-3">
                    <ShoppingCart className="w-3.5 h-3.5" /> ORDER TOTAL
                  </span>
                  
                  <div className="flex justify-between items-center text-[11px] text-zinc-400 font-sans">
                    <span>Subtotal</span>
                    <span className="font-bold text-white">${cartSubtotal.toFixed(0)}</span>
                  </div>
                  
                  {addSalesTax && (
                    <div className="flex justify-between items-center text-[11px] text-zinc-400 font-sans">
                      <div className="flex flex-col">
                        <span>Tax</span>
                        <span className="text-[9px] font-mono">(8.5%)</span>
                      </div>
                      <span className="font-bold text-white">${taxAmount.toFixed(0)}</span>
                    </div>
                  )}
                  
                  {discountAmount > 0 && !isGiveaway && (
                    <div className="flex justify-between items-center text-[11px] text-zinc-400 font-sans">
                      <span>Discount</span>
                      <span className="font-bold text-red-400">-${discountAmount.toFixed(0)}</span>
                    </div>
                  )}

                  {isGiveaway && (
                    <div className="flex justify-between items-center text-[11px] text-[#00ffcc] font-sans">
                      <span>Giveaway Comp</span>
                      <span className="font-bold">-${cartSubtotal.toFixed(0)}</span>
                    </div>
                  )}

                  {calculatedTipAmount > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-zinc-400 font-sans">
                      <span>Gratuity (Tip)</span>
                      <span className="font-bold text-[#00ffcc]">+${calculatedTipAmount.toFixed(0)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-zinc-800 pt-3 mt-2 mb-1 flex justify-between items-center">
                    <span className="text-sm font-display uppercase font-bold text-white tracking-wide">Total Due</span>
                    <span className="text-2xl font-display font-bold text-[#00ffcc]">${cartTotalValue.toFixed(0)}</span>
                  </div>

                  {paymentMethod === 'CASH' && cashReceived !== null && (
                    <>
                      <div className="flex justify-between items-center text-[11px] text-zinc-400 font-sans pt-1">
                        <span>Cash Received</span>
                        <span className="font-bold text-white">${cashReceived.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px] text-[#00ffcc] font-sans font-bold pt-1">
                        <span>Change Due</span>
                        <span>${changeDue.toFixed(0)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Live PayPal & Card integrated fields directly in the scroll container */}
                {paymentMethod === 'PAYPAL' && (
                  <div className="space-y-4 bg-[#0e1015] border border-amber-500/25 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800/85 pb-2 mb-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                          ⚡ PAYPAL GATEWAY OPTIONS
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          Active Code: {currentPaypalOrderId || 'GENERATING...'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('CASH');
                          triggerNotification("Switched back to Cash payment.");
                        }}
                        className="bg-zinc-900 border border-zinc-850 text-[9px] text-zinc-400 font-mono py-1 px-2 rounded-md hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
                      >
                        CLOSE
                      </button>
                    </div>

                    {/* Dual Mode Select Tab Bar */}
                    <div className="grid grid-cols-2 gap-1 bg-[#151821] p-1 rounded-xl border border-zinc-850">
                      <button
                        type="button"
                        onClick={() => setPaypalCheckoutMode('SELF')}
                        className={`py-2 text-[9.5px] uppercase font-mono font-bold tracking-wider rounded-lg transition duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          paypalCheckoutMode === 'SELF'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black'
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                        }`}
                      >
                        <span>Scan QR Code</span>
                        <span className="text-[7.5px] opacity-60">Customer's Phone</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaypalCheckoutMode('MERCHANT')}
                        className={`py-2 text-[9.5px] uppercase font-mono font-bold tracking-wider rounded-lg transition duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          paypalCheckoutMode === 'MERCHANT'
                            ? 'bg-zinc-850 border border-zinc-700 text-white font-black'
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                        }`}
                      >
                        <span>Merchant Terminal</span>
                        <span className="text-[7.5px] opacity-60">Backup Screen</span>
                      </button>
                    </div>

                    {/* Path A: Customer Self-Pay QR Code display */}
                    {paypalCheckoutMode === 'SELF' ? (
                      <div className="space-y-4 pt-1 flex flex-col items-center text-center">
                        <div className="text-zinc-300 font-mono text-[10px] leading-relaxed max-w-[240px]">
                          Point camera at this code to finalize payment securely on <span className="text-amber-400 font-semibold">your phone</span>.
                        </div>

                        {/* Beautiful generated QR Code block */}
                        {currentPaypalOrderId && (() => {
                          const compactCart = cart.map(c => ({
                            name: c.name,
                            variantName: c.variantName,
                            quantity: c.quantity,
                            price: c.price
                          }));
                          const safeImageUrl = (cart[0]?.image_url && !cart[0].image_url.startsWith('data:')) 
                            ? cart[0].image_url 
                            : '';
                          
                          const payLink = `${window.location.origin}/pay?id=${currentPaypalOrderId}&amount=${cartTotalValue}&item_name=${encodeURIComponent(cart[0]?.name || 'Basket')}${cart.length > 1 ? ` + ${cartTotalItemCount - cart[0].quantity} item(s)` : ''}&item_type=${encodeURIComponent(cart[0]?.variantName || 'Multiple')}&quantity=${cartTotalItemCount}&show_id=${selectedShowId || 'unlinked'}&band_id=${activeBandId || 'unlinked'}&band_name=${encodeURIComponent(activeBandName || 'Band')}&image_url=${encodeURIComponent(safeImageUrl)}&cart_items=${encodeURIComponent(JSON.stringify(compactCart))}`;
                          
                          return (
                            <div className="relative p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=000000&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(payLink)}`}
                                alt="PayPal Secure Pay QR Link"
                                className="w-[180px] h-[180px] object-contain rounded-md"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            </div>
                          );
                        })()}

                        {/* Polling live feedback status indicator */}
                        <div className="flex items-center gap-1.5 py-0.5 px-3 bg-amber-500/5 rounded-full border border-amber-500/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-[9px] font-mono text-amber-300 uppercase tracking-wider">
                            ⌛ Listening for customer checkout...
                          </span>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleCustomerPaidSelfCheckout();
                            }}
                            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-550 text-amber-400 font-mono text-[9px] uppercase font-bold tracking-wider rounded-xl transition cursor-pointer"
                          >
                            Simulate Success
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod('CASH');
                              triggerNotification("Switched back to Cash payment.");
                            }}
                            className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-500 hover:text-zinc-350 font-mono text-[9px] uppercase font-bold tracking-wider rounded-xl transition cursor-pointer"
                          >
                            Cancel Transaction
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Path B: Merchant Backup Traditional popup checkout buttons */
                      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
                        <div className="space-y-3">
                          <p className="text-[10px] font-sans text-zinc-400 text-center">
                            Process payment directly on the merchant tablet using PayPal/Cards.
                          </p>
                          <div className="paypal-button-container min-h-[50px] relative z-[100] overflow-y-visible">
                            <PayPalButtons
                              style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
                              createOrder={(data, actions) => {
                                if (cartTotalValue <= 0) {
                                  triggerNotification("Cannot process $0 transactions with PayPal.");
                                  throw new Error("Zero-amount transaction");
                                }
                                return actions.order.create({
                                  intent: "CAPTURE",
                                  purchase_units: [
                                    {
                                      amount: {
                                        currency_code: "USD",
                                        value: cartTotalValue.toFixed(2),
                                      },
                                      description: `Nexus Core - ${cartTotalItemCount} items`
                                    },
                                  ],
                                });
                              }}
                              onApprove={async (data, actions) => {
                                if (actions.order) {
                                  try {
                                    const details = await actions.order.capture();
                                    const payerName = details.payer?.name?.given_name || 'Customer';
                                    const paymentId = details.id || 'N/A';
                                    addLog(`PayPal Payment Captured. ID: ${paymentId}. Buyer: ${payerName}`);
                                    triggerNotification(`💰 PayPal payment authorization success! Thank you ${payerName}.`);
                                    await handleCheckoutSubmit('PAYPAL');
                                  } catch (err) {
                                    console.error("Error capturing PayPal order:", err);
                                    triggerNotification("Failed to capture PayPal token. Try again.");
                                  }
                                }
                              }}
                              onError={(err) => {
                                console.error("PayPal Smart Button Error:", err);
                                triggerNotification("PayPal transaction error. Please check card or connection.");
                              }}
                              onCancel={() => {
                                addLog("User canceled PayPal payment popup.");
                                triggerNotification("PayPal payment was canceled.");
                              }}
                            />
                          </div>

                          <div className="border-t border-zinc-800/65 pt-3">
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentMethod('CASH');
                                triggerNotification("Switched back to Cash payment.");
                              }}
                              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              Pay another way
                            </button>
                          </div>
                        </div>
                      </PayPalScriptProvider>
                    )}
                  </div>
                )}

                {/* Integrated Multi-tab Card Payment Terminal */}
                {paymentMethod === 'CARD' && (
                  <div className="space-y-4 bg-[#0e1015] border border-blue-500/25 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800/85 pb-2 mb-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                          🔵 INTEGRATED CARD TERMINAL
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          Built-in NFC & External Reader Support
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('CASH');
                          triggerNotification("Switched back to Cash payment.");
                        }}
                        className="bg-zinc-900 border border-zinc-850 text-[9px] text-zinc-400 font-mono py-1 px-2 rounded-md hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
                      >
                        CLOSE
                      </button>
                    </div>

                    {/* 2 Tabs selectors */}
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-zinc-900">
                      <button
                        type="button"
                        onClick={() => {
                          setCardCheckoutTab('NFC');
                          triggerNotification("Selected Device Tap to Pay (NFC)");
                        }}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          cardCheckoutTab === 'NFC'
                            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black'
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                        }`}
                      >
                        <Wifi className="w-3.5 h-3.5 rotate-90 text-blue-400" />
                        <div className="flex flex-col text-left">
                          <span>Tap to Pay</span>
                          <span className="text-[7.5px] opacity-60 font-mono">Built-In NFC</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCardCheckoutTab('READER');
                          triggerNotification("Selected External Physical Reader");
                        }}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          cardCheckoutTab === 'READER'
                            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black'
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                        }`}
                      >
                        <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                        <div className="flex flex-col text-left">
                          <span>Physical Reader</span>
                          <span className="text-[7.5px] opacity-60 font-mono">Bluetooth Terminal</span>
                        </div>
                      </button>
                    </div>

                    {/* Tab A Content: NFC Tap-to-Pay */}
                    {cardCheckoutTab === 'NFC' && (
                      <div className="space-y-4 pt-1 flex flex-col items-center">
                        {nfcScanStatus === 'IDLE' && (
                          <div className="w-full text-center py-6 px-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-3">
                            <div className="relative flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Wifi className="w-6 h-6 rotate-90" />
                              </div>
                              <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-25" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-zinc-300 font-sans font-bold text-xs">NFC Reader Active & Standing By</p>
                              <p className="text-[10px] text-zinc-500 leading-normal max-w-[220px] mx-auto">
                                Tap any contactless card or digital wallet (Apple Pay, Google Pay) directly to the top edge of this device.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNfcScanStatus('SCANNING');
                                triggerNotification("Scanning for NFC tap...");
                                addLog("NFC sensor active: listening for proximity credentials...");
                                setTimeout(() => {
                                  setNfcScanStatus('SUCCESS');
                                  const cardNames = ["Sarah Connor", "Trent Reznor", "Kim Deal", "Dave Grohl"];
                                  const randName = cardNames[Math.floor(Math.random() * cardNames.length)];
                                  const last4 = Math.floor(Math.random() * 9000) + 1000;
                                  setCardScannedName(randName);
                                  setCardScannedDetails(`Visa Credit •••• ${last4}`);
                                  triggerNotification("⚡ Proximity tap detected & validated!");
                                  addLog(`NFC Tap card accepted: ${randName} (Visa ending in ${last4})`);
                                }, 1500);
                              }}
                              className="py-1.5 px-4 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800 text-blue-300 font-mono text-[9px] uppercase tracking-wider rounded-lg cursor-pointer transition-all"
                            >
                              Simulate Customer Tap-to-Pay Card
                            </button>
                          </div>
                        )}

                        {nfcScanStatus === 'SCANNING' && (
                          <div className="w-full text-center py-8 px-4 bg-zinc-950/40 border border-blue-500/30 rounded-2xl flex flex-col items-center justify-center gap-4">
                            <div className="relative flex items-center justify-center">
                              <div className="absolute w-20 h-20 rounded-full border border-dashed border-blue-500/40 animate-spin" />
                              <div className="absolute w-16 h-16 rounded-full border border-blue-500/20 bg-blue-500/5 animate-pulse" />
                              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-300 relative z-10">
                                <Wifi className="w-6 h-6 rotate-90" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-blue-400 font-mono font-bold text-xs tracking-wider uppercase animate-pulse">📡 Listening for Proximity Tap...</p>
                              <p className="text-[9px] text-zinc-550 font-mono">
                                Awaiting induction field contact...
                              </p>
                            </div>
                          </div>
                        )}

                        {nfcScanStatus === 'SUCCESS' && (
                          <div className="w-full text-center py-5 px-4 bg-blue-950/15 border border-blue-500/40 rounded-2xl flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                              <Check className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 font-mono text-center">
                              <p className="text-zinc-500 text-[8px] uppercase tracking-wider">TAP CREDENTIALS MATCHED</p>
                              <p className="text-white font-bold text-xs">{cardScannedName}</p>
                              <p className="text-[#00ffcc] text-[10px]">{cardScannedDetails}</p>
                            </div>
                            <div className="flex gap-2 w-full pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setNfcScanStatus('IDLE');
                                  setCardScannedName('');
                                  setCardScannedDetails('');
                                  addLog("Reset NFC reader state.");
                                }}
                                className="flex-1 py-1 px-2 text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 rounded hover:text-white transition cursor-pointer font-mono uppercase"
                              >
                                Try Again
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  setIsCardProcessing(true);
                                  addLog("Initiating multi-channel remote processor authentication for NFC card...");
                                  setTimeout(() => {
                                    setIsCardProcessing(false);
                                    handleCheckoutSubmit('CARD');
                                  }, 1000);
                                }}
                                disabled={isCardProcessing}
                                className="flex-[2] py-1.5 px-3 bg-[#00ffd2] hover:bg-[#12b295] text-black font-sans font-bold text-[10px] uppercase tracking-wider rounded transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                {isCardProcessing ? "CHARGING..." : "💰 Charge & Complete"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab B Content: Physical Bluetooth Card Reader */}
                    {cardCheckoutTab === 'READER' && (
                      <div className="space-y-4 pt-1 flex flex-col items-center">
                        <div className="w-full py-4 px-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-3 font-mono text-[10px]">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                            <div className="flex items-center gap-2">
                              <Bluetooth className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                              <span className="text-zinc-300 font-bold">Square/Zettle Hardware</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500">Bat: <strong className="text-emerald-400">{hardwareReaderBattery}%</strong></span>
                              <span className="text-zinc-500">Sig: <strong className="text-blue-400">{hardwareReaderSignal}</strong></span>
                            </div>
                          </div>

                          {readerStatus === 'IDLE' && (
                            <div className="space-y-3 text-center py-2 flex flex-col items-center">
                              <p className="text-zinc-400 leading-normal text-[9.5px]">
                                Bluetooth Reader Connected and Confirmed. Standing by for Swipe, Chip Insert, or Tap.
                              </p>
                              
                              <div className="w-20 h-1 rounded-full bg-blue-500/20 relative overflow-hidden">
                                <div className="absolute top-0 bottom-0 left-0 bg-blue-400 w-1/3 rounded-full animate-[pulse_1.5s_infinite]" />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setReaderStatus('WAITING_FOR_CARD');
                                  triggerNotification("Physical Reader waiting for card swipe/insert...");
                                  addLog("Hardware Terminal command sent: waiting for card insertion...");
                                  setTimeout(() => {
                                    setReaderStatus('SUCCESS');
                                    const cardNames = ["Kurt Cobain", "Kim Deal", "Beck Hansen"];
                                    const randName = cardNames[Math.floor(Math.random() * cardNames.length)];
                                    const last4 = Math.floor(Math.random() * 9000) + 1000;
                                    setCardScannedName(randName);
                                    setCardScannedDetails(`Mastercard Chip •••• ${last4}`);
                                    triggerNotification("⚡ External reader successfully processed chip!");
                                    addLog(`External reader payment credential captured: ${randName} (ending in ${last4})`);
                                  }, 1500);
                                }}
                                className="py-1.5 px-4 bg-zinc-905 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-sans text-[9px] uppercase tracking-wider rounded-lg cursor-pointer transition-all"
                              >
                                Simulate Swipe, Insert or Terminal Action
                              </button>
                            </div>
                          )}

                          {readerStatus === 'WAITING_FOR_CARD' && (
                            <div className="space-y-3 text-center py-4 flex flex-col items-center">
                              <p className="text-blue-400 font-bold uppercase tracking-wider animate-pulse text-[10px]">
                                ⌛ WAITING ON MERCHANT HARDWARE...
                              </p>
                              <p className="text-zinc-500 text-[8.5px] leading-snug">
                                Swiping magnetic strip, inserting smart chip, or tapping physical card on Zettle/Square hardware now...
                              </p>
                              <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin" />
                            </div>
                          )}

                          {readerStatus === 'SUCCESS' && (
                            <div className="space-y-3 text-center py-2 flex flex-col items-center">
                              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce">
                                <Check className="w-4 h-4" />
                              </div>
                              <div className="space-y-1">
                                <span className="text-zinc-500 text-[8px] uppercase tracking-widest block">Hardware Reader Auth</span>
                                <span className="text-white font-bold">{cardScannedName}</span>
                                <span className="text-emerald-400 font-mono text-[9px]">{cardScannedDetails}</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 w-full pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReaderStatus('IDLE');
                                    setCardScannedName('');
                                    setCardScannedDetails('');
                                    addLog("Cleared external reader status.");
                                  }}
                                  className="py-1 px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[9px] font-mono hover:text-white transition cursor-pointer"
                                >
                                  Try Again
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setIsCardProcessing(true);
                                    addLog("Authenticating chip tokens via cellular merchant network...");
                                    setTimeout(() => {
                                      setIsCardProcessing(false);
                                      handleCheckoutSubmit('CARD');
                                    }, 1000);
                                  }}
                                  disabled={isCardProcessing}
                                  className="py-1.5 px-3 bg-[#00ffd2] hover:bg-[#12b295] text-black font-sans font-bold text-[9px] uppercase tracking-wider rounded transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  {isCardProcessing ? "AUTHORIZING..." : "💰 Confirm payment"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Help tip footer */}
                    <div className="bg-blue-950/20 border border-blue-500/10 p-2.5 rounded-xl font-mono text-[8px] text-zinc-400 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed text-zinc-500">
                        NFC proximity receiver is located at the top rear of the device. Make sure physical card readers are connected via bluetooth in settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Live Cash App QR payment details */}
                {paymentMethod === 'QR' && (
                  <div className="space-y-4 bg-[#0e1015] border border-emerald-500/25 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800/85 pb-2 mb-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                          🟢 CASH APP TERMINAL
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          Scan & Pay Instantly
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('CASH');
                          triggerNotification("Switched back to Cash payment.");
                        }}
                        className="bg-zinc-900 border border-zinc-850 text-[9px] text-zinc-400 font-mono py-1 px-2 rounded-md hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
                      >
                        CLOSE
                      </button>
                    </div>

                    {/* Cashtag settings row */}
                    <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-wide">
                          Merchant $Cashtag
                        </label>
                        <span className="text-[8px] text-emerald-400 font-mono bg-[#00D632]/10 px-1 py-0.5 rounded">
                          Saved locally
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/55 border border-emerald-500/30 rounded-lg px-3 py-1.5 focus-within:border-emerald-500 transition">
                        <span className="text-zinc-500 font-bold text-sm">$</span>
                        <input
                          type="text"
                          value={cashAppCashtag}
                          onChange={(e) => handleCashtagChange(e.target.value)}
                          placeholder="yourcashtag"
                          className="bg-transparent border-none text-sm font-mono text-white focus:outline-none w-full placeholder-zinc-700"
                        />
                      </div>
                      <p className="text-[8.5px] text-zinc-500 leading-normal">
                        The QR code dynamically generates a link to <span className="font-mono text-zinc-400">cash.app/${cashAppCashtag.trim().replace(/^\$/, '')}/{cartTotalValue.toFixed(2)}</span> prefilled.
                      </p>
                    </div>

                    {/* QR Code and Instructions */}
                    <div className="space-y-4 pt-1 flex flex-col items-center text-center">
                      <div className="text-zinc-300 font-mono text-[10px] leading-relaxed max-w-[240px]">
                        Point customer phone's camera at this code to pay <span className="text-emerald-400 font-semibold">${cartTotalValue.toFixed(2)}</span> instantly.
                      </div>

                      {/* Cash App dynamic QR code */}
                      {(() => {
                        const cleanCashtag = cashAppCashtag.trim().replace(/^\$/, '');
                        const payLink = `https://cash.app/$${cleanCashtag}/${cartTotalValue.toFixed(2)}`;
                        
                        return (
                          <div className="relative p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=000000&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(payLink)}`}
                              alt={`Cash App pay link to $${cleanCashtag}`}
                              className="w-[180px] h-[180px] object-contain rounded-md"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          </div>
                        );
                      })()}

                      {/* Simulation/Completing transaction */}
                      <div className="w-full flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleCheckoutSubmit('QR');
                          }}
                          className="w-full py-3 bg-[#00D632] hover:brightness-110 text-black font-sans font-black text-[11px] uppercase tracking-wider rounded-xl transition duration-150-all cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          💸 Confirm Cash App Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('CASH');
                            triggerNotification("Switched back to Cash payment.");
                          }}
                          className="w-full py-2 bg-zinc-900 border border-zinc-850 hover:bg-[#181a21] text-zinc-500 hover:text-zinc-400 font-mono text-[9px] uppercase tracking-wider rounded-lg transition cursor-pointer"
                        >
                          Cancel / Pay Cash
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Checkout bottom action button */}
              <div className="px-5 pb-4">
                {paymentMethod !== 'PAYPAL' && paymentMethod !== 'QR' && paymentMethod !== 'CARD' && (
                  <button
                    type="button"
                    onClick={() => handleCheckoutSubmit()}
                    className="w-full py-4 bg-gradient-to-r from-[#00ffd2] to-[#12b295] hover:brightness-110 text-black font-sans font-bold uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-[#00ffd2]/10 active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    COMPLETE TRANSACTION
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS CELEBRATION MODAL */}
      <AnimatePresence>
        {showSuccessModal && lastSaleDetails && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            {/* Custom Confetti Emitter Particle System */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
              {Array.from({ length: 90 }).map((_, i) => {
                const colors = ['#00ffcc', '#00ffd2', '#12b295', '#ff0055', '#ffcc00', '#0099ff', '#ff00ff'];
                const color = colors[i % colors.length];
                const size = Math.random() * 8 + 6;
                const startX = Math.random() * 100;
                const duration = Math.random() * 1.8 + 1.2;
                const delay = Math.random() * 0.4;
                const rotateSpeed = Math.random() * 720 - 360;
                const shape = i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'triangle';
                const driftX = Math.random() * 40 - 20;

                return (
                  <motion.div
                    key={`sales-dash-item-${i}`}
                    initial={{ 
                      opacity: 1, 
                      y: '-10vh', 
                      x: `${startX}vw`,
                      rotate: 0 
                    }}
                    animate={{ 
                      opacity: [1, 1, 0.8, 0],
                      y: '110vh',
                      x: `${startX + driftX}vw`,
                      rotate: rotateSpeed 
                    }}
                    transition={{ 
                      duration: duration, 
                      delay: delay, 
                      ease: "linear" 
                    }}
                    style={{
                      position: 'absolute',
                      width: shape === 'triangle' ? 0 : size,
                      height: shape === 'triangle' ? 0 : size,
                      backgroundColor: shape !== 'triangle' ? color : undefined,
                      borderRadius: shape === 'circle' ? '50%' : undefined,
                      borderLeft: shape === 'triangle' ? `${size / 2}px solid transparent` : undefined,
                      borderRight: shape === 'triangle' ? `${size / 2}px solid transparent` : undefined,
                      borderBottom: shape === 'triangle' ? `${size}px solid ${color}` : undefined,
                    }}
                  />
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm bg-[#0d0f15] border border-emerald-500/30 rounded-[32px] p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-[65px] pointer-events-none" />

              {/* Animated check ring */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-8 h-8 text-emerald-400 stroke-[3]" />
                  </motion.div>
                  <span className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping opacity-25 pointer-events-none" />
                </motion.div>
              </div>

              <h3 className="text-xl font-bold font-sans text-white tracking-tight uppercase">
                Payment Confirmed
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 tracking-wider mt-1 uppercase">
                SECURE TRANSACTION COMPLETE
              </p>

              {/* Amount detail panel */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6 p-4 bg-zinc-950/65 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center"
              >
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  RECEIVED via {lastSaleDetails.paymentMethod}
                </span>
                <span className="text-4xl font-mono font-black text-[#00ffcc] mt-1.5">
                  ${lastSaleDetails.amount.toFixed(2)}
                </span>
                <span className="text-[9px] font-mono text-emerald-300 font-bold mt-2.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
                  {lastSaleDetails.itemCount} Item{lastSaleDetails.itemCount > 1 ? 's' : ''} Dispatched
                </span>
              </motion.div>

              <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500 font-mono text-[10px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronizing database registers...</span>
              </div>

              <p className="text-[9px] font-mono text-zinc-600 mt-2.5">
                Automatically returning to register dashboard
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
