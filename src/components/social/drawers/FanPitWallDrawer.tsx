import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Send, ShoppingCart } from 'lucide-react';

export interface FanPitWallDrawerProps {
  activePitWallShow: any | null;
  setActivePitWallShow: (val: any | null) => void;
  userProfile?: any;
  triggerNotification?: (msg: string) => void;
  setIsCartOpen?: (val: boolean) => void;
  cartItems?: any[];
}

export const FanPitWallDrawer: React.FC<FanPitWallDrawerProps> = ({
  activePitWallShow,
  setActivePitWallShow,
  userProfile,
  triggerNotification,
  setIsCartOpen,
  cartItems = [],
}) => {
  const [newPitWallMessage, setNewPitWallMessage] = useState('');
  const [pitWallMessages, setPitWallMessages] = useState<any[]>([
    {
      id: 'msg_1',
      author: 'MetalHead99',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      content: 'Who is ready for tonight! Doors open in 1 hour! 🔥',
      time: '10m ago',
    },
    {
      id: 'msg_2',
      author: 'SarahV',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      content: 'Just grabbed merch! Line moves fast.',
      time: '5m ago',
    },
  ]);

  const handleSendPitWallMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPitWallMessage.trim()) return;

    const newMessage = {
      id: `pit_msg_${Date.now()}`,
      author: userProfile?.name || 'Anonymous Fan',
      avatar: userProfile?.avatar || userProfile?.profileAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      content: newPitWallMessage.trim(),
      time: 'Just now',
    };

    setPitWallMessages((prev) => [...prev, newMessage]);
    setNewPitWallMessage('');
    triggerNotification?.('✨ Posted to Fan Pit Wall!');
  };

  return (
    <AnimatePresence>
      {activePitWallShow !== null && (
        <motion.div
          key="fan-pit-wall-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[190]"
          onClick={() => setActivePitWallShow(null)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-[100dvh] w-full sm:w-[400px] bg-[#0c0f12] border-l border-rose-900/40 z-[200] flex flex-col justify-between ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-white font-display">
                    Fan Pit Wall
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Live Show Chat • {activePitWallShow?.venue || 'Live Event'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {setIsCartOpen && (
                  <button
                    onClick={() => {
                      setActivePitWallShow(null);
                      setIsCartOpen(true);
                    }}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 transition-colors relative"
                    title="Open Cart"
                  >
                    <ShoppingCart className="w-4 h-4 text-rose-400" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {cartItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setActivePitWallShow(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* System Notice */}
            <div className="px-4 py-2 bg-rose-950/20 border-b border-rose-900/30 text-[10px] text-rose-300 font-mono flex items-center justify-between">
              <span>📍 Verified Attendees & Fans</span>
              <span className="text-emerald-400">Live</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {pitWallMessages.map((msg, mIdx) => (
                <div key={msg.id ? `pit-msg-${msg.id}-${mIdx}` : `pit-msg-${mIdx}`} className="flex gap-3">
                  <img
                    src={msg.avatar}
                    alt={msg.author}
                    className="w-8 h-8 rounded-full border border-rose-900/40 object-cover shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{msg.author}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{msg.time}</span>
                    </div>
                    <div className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl rounded-tl-none text-xs text-zinc-300 leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendPitWallMessage} className="p-4 border-t border-zinc-800 bg-zinc-950/90">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPitWallMessage}
                  onChange={(e) => setNewPitWallMessage(e.target.value)}
                  placeholder="Shout into the pit..."
                  className="flex-1 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
                />
                <button
                  type="submit"
                  disabled={!newPitWallMessage.trim()}
                  className="p-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
