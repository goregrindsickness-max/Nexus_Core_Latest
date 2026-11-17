import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminPIN: string;
  setAdminPIN: (val: string) => void;
  setIsAdminMode: (val: boolean) => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  adminPIN,
  setAdminPIN,
  setIsAdminMode,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#050608] border border-rose-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.15)] relative p-6 flex flex-col items-center"
          >
            <Shield className="w-10 h-10 text-rose-500 mb-4" />
            <h2 className="text-white font-black uppercase text-xl tracking-widest mb-2 font-display">System Override</h2>
            <p className="text-zinc-400 text-xs font-mono text-center mb-6">Enter administrative PIN to access secured data registry.</p>
            
            <div className="flex gap-2 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={`pin-slot-${i}`} className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-xl font-black ${adminPIN.length > i ? 'border-rose-500 text-rose-500 bg-rose-500/10' : 'border-zinc-800 text-zinc-600 bg-zinc-900/50'}`}>
                  {adminPIN.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, nIdx) => (
                <button 
                  key={`pin-keypad-${num}-${nIdx}`}
                  onClick={() => {
                    if (adminPIN.length < 4) {
                      const newPin = adminPIN + num.toString();
                      setAdminPIN(newPin);
                      if (newPin === '1337') {
                        setTimeout(() => {
                          onClose();
                          setIsAdminMode(true);
                          setAdminPIN('');
                        }, 300);
                      } else if (newPin.length === 4) {
                        setTimeout(() => setAdminPIN(''), 500);
                      }
                    }
                  }}
                  className="h-12 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono font-bold text-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <div />
              <button 
                onClick={() => {
                  if (adminPIN.length < 4) {
                    const newPin = adminPIN + '0';
                    setAdminPIN(newPin);
                    if (newPin === '1337') {
                      setTimeout(() => {
                        onClose();
                        setIsAdminMode(true);
                        setAdminPIN('');
                      }, 300);
                    } else if (newPin.length === 4) {
                      setTimeout(() => setAdminPIN(''), 500);
                    }
                  }
                }}
                className="h-12 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono font-bold text-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                0
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-white font-mono uppercase tracking-widest transition-colors cursor-pointer"
            >
              Cancel Access Request
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
