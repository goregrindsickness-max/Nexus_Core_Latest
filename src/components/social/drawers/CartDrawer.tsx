import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Trash2, Minus, Plus, CreditCard } from 'lucide-react';

export interface CartDrawerProps {
  isCartOpen: boolean;
  setIsCartOpen: (val: boolean) => void;
  cartItems: any[];
  setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
  setShowStripeCartCheckout: (val: boolean) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isCartOpen,
  setIsCartOpen,
  cartItems,
  setCartItems,
  setShowStripeCartCheckout,
}) => {
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
            className="w-full max-w-md h-full bg-[#121214] border-l border-zinc-900 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
              <span className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 font-display">
                <ShoppingCart className="w-5 h-5 text-rose-500" /> Your Cart
              </span>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-4">
                  <ShoppingCart className="w-16 h-16 text-zinc-800" />
                  <div>
                    <p className="font-bold text-white">Your cart is empty</p>
                    <p className="text-xs mt-1">Browse the store to support bands.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group cart items by Band Name */}
                  {Array.from(new Set(cartItems.map((item) => item.bandName))).map((bandName, bIdx) => {
                    const bandItems = cartItems.filter((item) => item.bandName === bandName);
                    const bandSubtotal = bandItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

                    return (
                      <div key={`band-group-${bandName}-${bIdx}`} className="bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="bg-zinc-900/80 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">
                            Ships from: {bandName}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">${bandSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                          {bandItems.map((item, itemIdx) => (
                            <div key={item.id ? `cart-item-${item.id}-${item.size || ''}-${itemIdx}` : `cart-item-${itemIdx}`} className="p-4 flex gap-4">
                              <div className="w-16 h-16 rounded-md overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                                <img src={item.image} alt={item?.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 flex flex-col min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-xs font-bold text-white leading-tight">{item?.name}</h4>
                                  <button
                                    onClick={() => setCartItems((prev) => prev.filter((i) => i.id !== item.id))}
                                    className="text-zinc-600 hover:text-rose-500 transition-colors shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                {item.size && (
                                  <span className="text-[10px] text-zinc-500 mt-1 uppercase">Size: {item.size}</span>
                                )}
                                <div className="mt-auto flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-3 border border-zinc-800 rounded-lg px-2 py-1 bg-black/40">
                                    <button
                                      onClick={() =>
                                        setCartItems((prev) =>
                                          prev.map((i) =>
                                            i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
                                          )
                                        )
                                      }
                                      className="text-zinc-400 hover:text-white"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-[10px] font-mono font-bold text-white w-4 text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setCartItems((prev) =>
                                          prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
                                        )
                                      }
                                      className="text-zinc-400 hover:text-white"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <span className="font-mono text-sm text-white font-bold">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 bg-zinc-950 border-t border-zinc-900 shrink-0">
                <div className="space-y-2 mb-4 text-xs font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>
                      ${cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Estimated Shipping</span>
                    <span>
                      ${(Array.from(new Set(cartItems.map((item) => item.bandName))).length * 5).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-zinc-800">
                    <span>Total</span>
                    <span className="text-rose-400">
                      $
                      {(
                        cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0) +
                        Array.from(new Set(cartItems.map((item) => item.bandName))).length * 5
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setShowStripeCartCheckout(true);
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-950/45 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" /> Express Checkout
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
