import { useState } from 'react';

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

  // Cart & Stripe Checkout
  const [cartItems, setCartItems] = useState<{
    id: string;
    productId: string;
    name: string;
    price: number;
    image: string;
    bandName: string;
    quantity: number;
    size?: string;
  }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showStripeCartCheckout, setShowStripeCartCheckout] = useState(false);

  const addToCart = (product: any, size?: string) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id && item.size === size);
      if (existing) {
        return prev.map(item => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.thumbnail || product.image,
        bandName: product.seller || product.brand || 'Nexus Merchant',
        quantity: 1,
        size
      }];
    });
    setIsCartOpen(true);
    triggerNotification?.(`Added ${product.name} to cart.`);
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
