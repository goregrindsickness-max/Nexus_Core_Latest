import React, { useState } from 'react';
import { X, Ticket, CheckCircle, Calendar, Rocket, Shield } from 'lucide-react';
import { FeedPost } from '../types';

interface TicketPurchaseModalProps {
  selectedTicketShow: { post: FeedPost; date: any };
  onClose: () => void;
}

export const TicketPurchaseModal: React.FC<TicketPurchaseModalProps> = ({
  selectedTicketShow,
  onClose,
}) => {
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isProcessingTicket, setIsProcessingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-zinc-950 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20">
        {/* Header */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-400" />
            <h3 className="font-mono font-bold text-white uppercase">Secure Tickets</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {ticketSuccess ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-lg mb-1">Tickets Secured!</h4>
                <p className="text-zinc-400 text-sm">Your digital tickets have been added to your wallet and sent to your email.</p>
              </div>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold font-mono transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                  {selectedTicketShow.post.image_url ? (
                    <img src={selectedTicketShow.post.image_url} alt="Tour" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <Calendar className="w-8 h-8 text-zinc-700" />
                  )}
                </div>
                <div>
                  <div className="inline-block px-2 py-0.5 rounded bg-purple-950 border border-purple-900 text-[10px] font-mono text-purple-400 mb-1">
                    {selectedTicketShow.post.tourData?.tourName}
                  </div>
                  <h4 className="font-bold text-white leading-tight">{selectedTicketShow.date.city}</h4>
                  <p className="text-zinc-400 text-sm mt-0.5">{selectedTicketShow.date.venue}</p>
                  <p className="text-purple-400 text-xs font-mono font-bold mt-1 uppercase">{selectedTicketShow.date.date} • DOORS 19:00</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-300">Ticket Quantity</span>
                  <div className="flex items-center gap-3 bg-zinc-900 rounded-lg border border-zinc-800 p-1">
                    <button 
                      onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                      className="w-8 h-8 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-white w-4 text-center">{ticketQuantity}</span>
                    <button 
                      onClick={() => setTicketQuantity(Math.min(8, ticketQuantity + 1))}
                      className="w-8 h-8 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-zinc-400">Total Price</span>
                  <span className="text-xl font-black text-white font-mono">${(25.00 * ticketQuantity).toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setIsProcessingTicket(true);
                  setTimeout(() => {
                    setIsProcessingTicket(false);
                    setTicketSuccess(true);
                  }, 1500);
                }}
                disabled={isProcessingTicket}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-70"
              >
                {isProcessingTicket ? (
                  <span className="animate-pulse flex items-center gap-2">
                    <Rocket className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Checkout Securely
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
