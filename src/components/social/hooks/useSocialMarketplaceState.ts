import { useState, useEffect } from 'react';
import {
  readStoredCart,
  writeStoredCart,
  getItemAvailableStock,
  type CartFulfillmentMap,
} from '../../../services/shopCommerceService';

export interface UseSocialMarketplaceStateParams {
  setShowAddItemModal: (open: boolean) => void;
  triggerNotification?: (msg: string) => void;
}

export function useSocialMarketplaceState({
  setShowAddItemModal,
  triggerNotification
}: UseSocialMarketplaceStateParams) {
  // Checkout & Purchasing
  const [checkoutItem, setCheckoutItem] = useState<{ type: 'merch' | 'ticket' | 'music' | 'cart'; data: any } | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [purchaseStep, setPurchaseStep] = useState<'details' | 'processing' | 'success'>('details');
  const [shippingName, setShippingName] = useState('');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingErrors, setShippingErrors] = useState<any>({});

  // Song Share Modal
  const [showSongShareModal, setShowSongShareModal] = useState(false);
  const [songShareTitle, setSongShareTitle] = useState('');
  const [songShareArtist, setSongShareArtist] = useState('');
  const [songShareAlbum, setSongShareAlbum] = useState('');
  const [songShareSpotifyUrl, setSongShareSpotifyUrl] = useState('');
  const [songShareCoverUrl, setSongShareCoverUrl] = useState('');

  // Add Item Modal
  const [itemCategory, setItemCategory] = useState<'merch' | 'ticket' | 'music' | 'other'>('merch');
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  const [itemImages, setItemImages] = useState<string[]>([]);

  const handleSaveItem = () => {
    setShowAddItemModal(false);
    triggerNotification?.('Item listed on marketplace!');
  };

  // Cart & Stripe Checkout (Persistent)
  const [cartItems, setCartItems] = useState<{
    id: string;
    productId: string;
    name: string;
    price: number;
    image: string;
    bandName: string;
    quantity: number;
    size?: string;
    category?: string;
    subcategory?: string;
    stock?: number;
    maxStock?: number | null;
    tracks?: any[];
  }[]>(() => readStoredCart());
  const [fulfillmentMap, setFulfillmentMap] = useState<CartFulfillmentMap>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showStripeCartCheckout, setShowStripeCartCheckout] = useState(false);

  useEffect(() => {
    writeStoredCart(cartItems);
  }, [cartItems]);

  const addToCart = (product: any, size?: string, qty: number = 1) => {
    const requestedQty = Math.max(1, Number(qty) || 1);
    const normalizedSize = size || undefined;
    const stockCheck = getItemAvailableStock(product, normalizedSize);

    if (stockCheck.isSoldOut || stockCheck.isVariantSoldOut) {
      triggerNotification?.(
        normalizedSize
          ? `Sorry, "${product.name}" (${normalizedSize}) is currently sold out.`
          : `Sorry, "${product.name}" is currently sold out.`
      );
      return;
    }

    const maxAvailable = stockCheck.isUnlimited ? null : (stockCheck.variantStock ?? stockCheck.totalStock);

    setCartItems(prev => {
      const existing = prev.find(
        item => item.productId === product.id && (item.size || '') === (normalizedSize || '')
      );
      if (existing) {
        const nextQty = existing.quantity + requestedQty;
        const clampedQty = maxAvailable !== null ? Math.min(maxAvailable, nextQty) : nextQty;
        if (maxAvailable !== null && nextQty > maxAvailable) {
          triggerNotification?.(`Only ${maxAvailable} available in stock for ${product.name}.`);
        }
        return prev.map(item =>
          item.id === existing.id ? { ...item, quantity: clampedQty, maxStock: maxAvailable } : item
        );
      }

      const initialQty = maxAvailable !== null ? Math.min(maxAvailable, requestedQty) : requestedQty;
      return [
        ...prev,
        {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          image: product.thumbnail || product.image || product.fallbackThumbnail,
          bandName: product.bandName || product.artist || product.band || product.seller || product.brand || 'Nexus Merchant',
          quantity: initialQty,
          size: normalizedSize,
          category: product.category,
          subcategory: product.subcategory,
          stock: product.stock,
          maxStock: maxAvailable,
          tracks: product.tracks,
        },
      ];
    });
    setIsCartOpen(true);
    triggerNotification?.(`Added ${product.name}${normalizedSize ? ` (${normalizedSize})` : ''} to cart.`);
  };

  // Direct Merch Checkout
  const [selectedMerchSize, setSelectedMerchSize] = useState('M');
  const [selectedMerchQty, setSelectedMerchQty] = useState(1);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  return {
    checkoutItem,
    setCheckoutItem,
    selectedAlbum,
    setSelectedAlbum,
    selectedSize,
    setSelectedSize,
    quantity,
    setQuantity,
    purchaseStep,
    setPurchaseStep,
    shippingName,
    setShippingName,
    shippingStreet,
    setShippingStreet,
    shippingCity,
    setShippingCity,
    shippingState,
    setShippingState,
    shippingZip,
    setShippingZip,
    shippingPhone,
    setShippingPhone,
    shippingErrors,
    setShippingErrors,

    showSongShareModal,
    setShowSongShareModal,
    songShareTitle,
    setSongShareTitle,
    songShareArtist,
    setSongShareArtist,
    songShareAlbum,
    setSongShareAlbum,
    songShareSpotifyUrl,
    setSongShareSpotifyUrl,
    songShareCoverUrl,
    setSongShareCoverUrl,

    itemCategory,
    setItemCategory,
    itemTitle,
    setItemTitle,
    itemDescription,
    setItemDescription,
    itemPrice,
    setItemPrice,
    itemLocation,
    setItemLocation,
    itemImages,
    setItemImages,
    handleSaveItem,

    cartItems,
    setCartItems,
    fulfillmentMap,
    setFulfillmentMap,
    isCartOpen,
    setIsCartOpen,
    showStripeCartCheckout,
    setShowStripeCartCheckout,
    addToCart,

    selectedMerchSize,
    setSelectedMerchSize,
    selectedMerchQty,
    setSelectedMerchQty,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    checkoutSuccess,
    setCheckoutSuccess
  };
}
