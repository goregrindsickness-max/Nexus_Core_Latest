import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Trash2, Minus, Plus, CreditCard, Truck, MapPin, ShoppingBag } from 'lucide-react';
import {
  calculateCartShippingBreakdown,
  findUpcomingShowsForBand,
  FREE_SHIPPING_THRESHOLD_PER_BAND,
  type CartFulfillmentMap,
} from '../../../services/shopCommerceService';

export interface CartDrawerProps {
  isCartOpen: boolean;
  setIsCartOpen: (val: boolean) => void;
  cartItems: any[];
  setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
  setShowStripeCartCheckout: (val: boolean) => void;
  liveEvents?: any[];
  fulfillmentMap?: CartFulfillmentMap;
  setFulfillmentMap?: React.Dispatch<React.SetStateAction<CartFulfillmentMap>>;
}

const isSameCartLine = (a: any, b: any) =>
  a.id === b.id && (a.size || '') === (b.size || '');

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isCartOpen,
  setIsCartOpen,
  cartItems,
  setCartItems,
  setShowStripeCartCheckout,
  liveEvents = [],
  fulfillmentMap: propFulfillmentMap,
  setFulfillmentMap: propSetFulfillmentMap,
}) => {
  const [internalFulfillmentMap, setInternalFulfillmentMap] = useState<CartFulfillmentMap>({});
  const fulfillmentMap = propFulfillmentMap ?? internalFulfillmentMap;
  const setFulfillmentMap = propSetFulfillmentMap ?? setInternalFulfillmentMap;

  const { groups, subtotal, shippingTotal, grandTotal } = calculateCartShippingBreakdown(
    cartItems,
    fulfillmentMap
  );

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          key="cart-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-end"
          onClick={() => setIsCartOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-[100dvh] max-h-[100dvh] bg-[#121214] border-l border-zinc-900 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-zinc-900 bg-zinc-950/40 shrink-0">
              <span className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 font-display">
                <ShoppingCart className="w-5 h-5 text-rose-500" />
                Your Bag ({cartItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)})
              </span>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-4">
                  <ShoppingCart className="w-16 h-16 text-zinc-800" />
                  <div>
                    <p className="font-bold text-white">Your cart is empty</p>
                    <p className="text-xs mt-1">Browse the store to support bands and creators.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {groups.map((group) => {
                    const upcomingShows = findUpcomingShowsForBand(group.bandName, liveEvents);
                    const isBoothPickup = group.fulfillment.mode === 'booth_pickup';

                    return (
                      <div
                        key={`band-group-${group.bandKey}`}
                        className="bg-zinc-950/60 border border-zinc-800 rounded-xl overflow-hidden"
                      >
                        {/* Seller Header */}
                        <div className="bg-zinc-900/80 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase text-rose-400 tracking-wider truncate">
                            {group.bandName}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-zinc-300 font-semibold shrink-0">
                            ${group.subtotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Fulfillment & Free Shipping Bar */}
                        <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-900 space-y-2">
                          {upcomingShows.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                              <button
                                type="button"
                                onClick={() =>
                                  setFulfillmentMap((prev) => ({
                                    ...prev,
                                    [group.bandKey]: { mode: 'ship' },
                                  }))
                                }
                                className={`py-1 px-2 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                                  !isBoothPickup
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                <Truck className="w-3 h-3" /> Ship Order
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const firstShow = upcomingShows[0];
                                  setFulfillmentMap((prev) => ({
                                    ...prev,
                                    [group.bandKey]: {
                                      mode: 'booth_pickup',
                                      showId: firstShow.id,
                                      showTitle: firstShow.title,
                                      venue: firstShow.venue,
                                      date: firstShow.date,
                                    },
                                  }));
                                }}
                                className={`py-1 px-2 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                                  isBoothPickup
                                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                                    : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                <MapPin className="w-3 h-3" /> Merch Booth Pickup
                              </button>
                            </div>
                          )}

                          {isBoothPickup && upcomingShows.length > 0 ? (
                            <div className="space-y-1">
                              <label className="block text-[10px] text-emerald-400 font-medium">
                                Free Merch Booth Pickup ($0.00 shipping)
                              </label>
                              <select
                                value={group.fulfillment.showId || upcomingShows[0].id}
                                onChange={(e) => {
                                  const chosen = upcomingShows.find((s) => s.id === e.target.value);
                                  if (!chosen) return;
                                  setFulfillmentMap((prev) => ({
                                    ...prev,
                                    [group.bandKey]: {
                                      mode: 'booth_pickup',
                                      showId: chosen.id,
                                      showTitle: chosen.title,
                                      venue: chosen.venue,
                                      date: chosen.date,
                                    },
                                  }));
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-emerald-500"
                              >
                                {upcomingShows.map((sh) => (
                                  <option key={sh.id} value={sh.id}>
                                    {sh.venue} · {sh.date}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-zinc-400">
                                  {group.amountToFreeShipping > 0
                                    ? `Add $${group.amountToFreeShipping.toFixed(2)} more for free shipping`
                                    : `Free shipping unlocked ($${FREE_SHIPPING_THRESHOLD_PER_BAND}+)`}
                                </span>
                                <span
                                  className={
                                    group.shippingFee === 0
                                      ? 'text-emerald-400 font-bold'
                                      : 'text-zinc-300'
                                  }
                                >
                                  {group.shippingFee === 0 ? 'FREE' : `$${group.shippingFee.toFixed(2)}`}
                                </span>
                              </div>
                              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    group.amountToFreeShipping <= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${group.freeShippingProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Line Items */}
                        <div className="divide-y divide-zinc-800/50">
                          {group.items.map((item, itemIdx) => {
                            const maxStock =
                              typeof item.maxStock === 'number' && item.maxStock > 0 ? item.maxStock : null;

                            return (
                              <div
                                key={
                                  item.id
                                    ? `cart-item-${item.id}-${item.size || 'std'}-${itemIdx}`
                                    : `cart-item-${itemIdx}`
                                }
                                className="p-4 flex gap-3.5"
                              >
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800 flex items-center justify-center">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item?.name || 'Merch item'}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <ShoppingBag className="w-6 h-6 text-zinc-600" />
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-xs font-bold text-white leading-tight truncate">
                                      {item?.name}
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCartItems((prev) => prev.filter((i) => !isSameCartLine(i, item)))
                                      }
                                      className="text-zinc-500 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                                      title="Remove item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {item.size && (
                                    <span className="text-[11px] text-zinc-400 mt-0.5">
                                      Variant: {item.size}
                                    </span>
                                  )}
                                  <div className="mt-auto flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2.5 border border-zinc-800 rounded-lg px-2 py-1 bg-black/40">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCartItems((prev) =>
                                            prev.map((i) =>
                                              isSameCartLine(i, item)
                                                ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                                                : i
                                            )
                                          )
                                        }
                                        className="text-zinc-400 hover:text-white cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="text-xs font-mono tabular-nums font-bold text-white w-5 text-center">
                                        {item.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={maxStock !== null && item.quantity >= maxStock}
                                        onClick={() =>
                                          setCartItems((prev) =>
                                            prev.map((i) =>
                                              isSameCartLine(i, item)
                                                ? {
                                                    ...i,
                                                    quantity:
                                                      maxStock !== null
                                                        ? Math.min(maxStock, i.quantity + 1)
                                                        : i.quantity + 1,
                                                  }
                                                : i
                                            )
                                          )
                                        }
                                        className="text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-mono tabular-nums text-sm text-white font-bold">
                                      ${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-zinc-950 border-t border-zinc-900 shrink-0">
                <div className="space-y-2 mb-4 text-xs font-mono tabular-nums">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Shipping</span>
                    <span className={shippingTotal === 0 ? 'text-emerald-400 font-bold' : ''}>
                      {shippingTotal === 0 ? 'FREE' : `$${shippingTotal.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-zinc-800">
                    <span>Total</span>
                    <span className="text-rose-400">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setShowStripeCartCheckout(true);
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-950/45 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" /> Express Checkout (${grandTotal.toFixed(2)})
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
