import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Ticket,
  Clock,
  Shield,
  Tag,
  Share2,
  Check,
  UserPlus,
  ArrowUpRight,
  ShoppingBag,
  MapPin
} from 'lucide-react';
import Barcode from 'react-barcode';

export interface TicketEscrowModalProps {
  viewingReceipt: any | null;
  setViewingReceipt: (val: any | null) => void;
  selectedPassUser?: string;
  setSelectedPassUser?: (val: string) => void;
  selectedTicketAction?: 'transfer' | 'resell' | 'simulate_resale_buy' | null;
  setSelectedTicketAction?: (val: 'transfer' | 'resell' | 'simulate_resale_buy' | null) => void;
  ticketRecipientEmail?: string;
  setTicketRecipientEmail?: (val: string) => void;
  ticketResalePrice?: string;
  setTicketResalePrice?: (val: string) => void;
  handleTicketAction: (action: 'transfer' | 'resell' | 'simulate_resale_buy' | 'cancel_resale') => void;
  triggerNotification?: (msg: string) => void;
  userProfile?: any;
}

export const TicketEscrowModal: React.FC<TicketEscrowModalProps> = ({
  viewingReceipt,
  setViewingReceipt,
  selectedPassUser,
  setSelectedPassUser,
  selectedTicketAction,
  setSelectedTicketAction,
  ticketRecipientEmail,
  setTicketRecipientEmail,
  ticketResalePrice,
  setTicketResalePrice,
  handleTicketAction,
  triggerNotification,
  userProfile,
}) => {
  const [internalPassUser, setInternalPassUser] = useState('');
  const [internalTicketAction, setInternalTicketAction] = useState<'transfer' | 'resell' | 'simulate_resale_buy' | null>(null);
  const [internalRecipientEmail, setInternalRecipientEmail] = useState('');
  const [internalResalePrice, setInternalResalePrice] = useState('');
  const [transferMode, setTransferMode] = useState<'none' | 'select' | 'transfer' | 'resell'>('none');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [resellPrice, setResellPrice] = useState('');
  const [resellPaymentInfo, setResellPaymentInfo] = useState('');
  const [resellMethod, setResellMethod] = useState<'payout' | 'store_credit' | 'marketplace' | 'private'>('payout');
  const [transferringAttendeeIndex, setTransferringAttendeeIndex] = useState<number | null>(null);

  const passUser = selectedPassUser ?? internalPassUser;
  const setPassUser = setSelectedPassUser ?? setInternalPassUser;
  const ticketAction = selectedTicketAction ?? internalTicketAction;
  const setTicketAction = setSelectedTicketAction ?? setInternalTicketAction;
  const recipientEmail = ticketRecipientEmail ?? internalRecipientEmail;
  const setRecipientEmail = setTicketRecipientEmail ?? setInternalRecipientEmail;
  const resalePrice = ticketResalePrice ?? internalResalePrice;
  const setResalePrice = setTicketResalePrice ?? setInternalResalePrice;
  return (
    <>
      {/* Receipt Modal */}
      <AnimatePresence>
        {viewingReceipt && (
          <motion.div key="receipt-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setViewingReceipt(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#121214] border border-rose-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.15)] flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/40">
                <span className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5 font-display">
                  {viewingReceipt.type === 'ticket' ? <Ticket className="w-4 h-4 text-rose-400" /> : <ShoppingBag className="w-4 h-4 text-rose-400" />}
                  {viewingReceipt.type === 'ticket' ? 'Digital Ticket' : 'Digital Receipt'}
                </span>
                <button 
                  onClick={() => setViewingReceipt(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar">
                {viewingReceipt.type === 'ticket' && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Resale Listed Badge Indicator */}
                    {viewingReceipt.data.isListedForResale && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                          <div className="text-xs">
                            <span className="text-amber-400 font-bold font-mono">Listed for Resale</span>
                            <span className="text-zinc-400 block text-[10px] font-mono mt-0.5">Attendee Ticket #{ (viewingReceipt.data.resaleAttendeeIdx || 0) + 1 } listed at ${viewingReceipt.data.resellPrice?.toFixed(2)}</span>
                          </div>
                        </div>
                        <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold font-mono">${viewingReceipt.data.resellPrice?.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Show Flyer / Poster Preview */}
                    {viewingReceipt.data.flyer && (
                      <div className="w-full h-44 rounded-xl overflow-hidden border border-zinc-800 relative group shadow-lg shadow-black/40">
                        <img src={viewingReceipt.data.flyer} alt="Show Flyer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex items-end p-3.5">
                          <div>
                            <span className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-md">Show Flyer</span>
                            <p className="text-[10px] text-zinc-300 mt-1 uppercase font-mono font-bold tracking-tight">Access Gate Commemorative Pass</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Venue Details & Driving Directions */}
                    <div className="text-center space-y-1.5 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900 shadow-inner">
                      <div className="text-xl font-black text-rose-400 uppercase tracking-wide leading-tight font-display">{viewingReceipt.data.headliner || viewingReceipt.data.name}</div>
                      
                      <div className="text-xs text-zinc-300 font-bold flex items-center justify-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {viewingReceipt.data.venue}
                      </div>
                      
                      {viewingReceipt.data.venueAddress && (
                        <p className="text-[10px] text-zinc-500 font-mono max-w-xs mx-auto leading-relaxed">{viewingReceipt.data.venueAddress}</p>
                      )}
                      
                      <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-center gap-2 pt-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-600" /> {viewingReceipt.data.time || 'Doors 8:00 PM'}
                      </div>

                      {/* Direction Launchers */}
                      <div className="pt-2.5 mt-2 border-t border-zinc-900/60 flex justify-center gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingReceipt.data.venueAddress || `${viewingReceipt.data.venue} Los Angeles`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[9px] bg-zinc-900 hover:bg-zinc-800 hover:text-white px-3 py-2 rounded-lg border border-zinc-800 font-mono text-zinc-400 transition-colors"
                        >
                          Google Maps <ArrowUpRight className="w-2.5 h-2.5 text-rose-500" />
                        </a>
                        <a
                          href={`https://maps.apple.com/?q=${encodeURIComponent(viewingReceipt.data.venueAddress || `${viewingReceipt.data.venue} Los Angeles`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[9px] bg-zinc-900 hover:bg-zinc-800 hover:text-white px-3 py-2 rounded-lg border border-zinc-800 font-mono text-zinc-400 transition-colors"
                        >
                          Apple Maps <ArrowUpRight className="w-2.5 h-2.5 text-rose-500" />
                        </a>
                      </div>
                    </div>

                    {/* Show Lineup Board */}
                    {viewingReceipt.data.lineup && (
                      <div className="bg-[#0b0c0f] border border-zinc-900 rounded-xl p-3.5 text-center shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/25 to-transparent" />
                        <span className="text-[9px] text-rose-500 tracking-[0.2em] font-black uppercase font-mono">Heavy Roster / Full Lineup</span>
                        <p className="text-[10px] font-mono font-bold text-zinc-400 mt-1 uppercase tracking-tight leading-relaxed">{viewingReceipt.data.lineup}</p>
                      </div>
                    )}

                    {/* High-Fidelity Barcode Section */}
                    {transferMode === 'none' && (
                      <div className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-xl border border-zinc-200">
                        {/* Security Seal Watermark */}
                        <div className="absolute top-2 right-2 text-zinc-300 pointer-events-none opacity-20">
                          <Shield className="w-8 h-8" />
                        </div>
                        
                        {/* Realistic dynamic barcode */}
                        <div className="w-full flex justify-center">
                          <Barcode
                            value={`TKT-${viewingReceipt.id.toUpperCase()}`}
                            format="CODE128"
                            width={1.6}
                            height={64}
                            displayValue={false}
                            background="transparent"
                            lineColor="#000000"
                          />
                        </div>
                        
                        <div className="text-[9px] font-mono tracking-[0.25em] font-black mt-2 text-black text-center uppercase">
                          *TKT-{viewingReceipt.id.slice(-8).toUpperCase()}*
                        </div>
                        
                        <div className="mt-3.5 border-t border-dashed border-zinc-300 pt-3 w-full flex justify-between items-center text-black font-mono text-[9px] font-bold">
                          <div>
                            <span className="text-zinc-400 font-normal uppercase text-[8px] block leading-none mb-0.5">Security Pass ID</span>
                            {viewingReceipt.id.slice(-10).toUpperCase()}
                          </div>
                          <div className="text-right">
                            <span className="text-zinc-400 font-normal uppercase text-[8px] block leading-none mb-0.5">Status Check</span>
                            <span className="text-emerald-600 font-black flex items-center justify-end gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> SECURE GATE
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attendee Passes Customizer List */}
                    {viewingReceipt.data.attendees && viewingReceipt.data.attendees.length > 0 && transferMode === 'none' && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider font-mono">Personalized Attendee Passes ({viewingReceipt.quantity})</div>
                        <div className="space-y-2 max-h-[22vh] overflow-y-auto pr-1">
                          {viewingReceipt.data.attendees.map((att: any, idx: number) => (
                            <div key={`attendee-pass-${att?.name || ''}-${idx}`} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 rounded-xl relative overflow-hidden group">
                              <div className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-[10px] text-rose-400 font-bold font-mono">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    {att?.name}
                                    {viewingReceipt.data.isListedForResale && viewingReceipt.data.resaleAttendeeIdx === idx && (
                                      <span className="bg-amber-500/10 border border-amber-500/20 text-[8px] font-mono font-bold text-amber-400 uppercase px-1 rounded">Listed</span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mt-0.5">
                                    {att.tier === 'ga' ? 'General Admission (GA)' : att.tier === 'vip' ? 'VIP Access Pass' : 'VIP Ultimate Fan Bundle'}
                                  </div>
                                </div>
                              </div>
                              {att.size && (
                                <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[9px] text-rose-400 font-mono font-black uppercase shrink-0">
                                  Size: {att.size}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECURE ESCROW / TRANSFER / RESELL SECTIONS */}
                    {transferMode === 'none' && (
                      <div className="pt-2 border-t border-zinc-900 flex flex-col gap-2">
                        {viewingReceipt.data.isListedForResale ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleTicketAction('simulate_resale_buy')}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4 animate-bounce" /> Simulate Marketplace Buyer Purchase
                            </button>
                            <p className="text-[9px] text-zinc-500 text-center font-mono max-w-xs mx-auto leading-normal">
                              Because you are responsible for acquiring funds, this test trigger simulates the direct payment clearance, credits your Resale Balance, and transfers the ticket.
                            </p>
                            <button
                              onClick={() => handleTicketAction('cancel_resale')}
                              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-[10px] uppercase py-2 rounded-lg transition-colors border border-zinc-850"
                            >
                              Cancel Resale Listing
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setTransferMode('select');
                              setTransferRecipient('');
                              setTransferMessage('');
                              setResellPrice('');
                              setResellPaymentInfo('');
                              setTransferringAttendeeIndex(0);
                            }}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-rose-400 font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all border border-rose-950/40 flex items-center justify-center gap-2 hover:scale-[1.01]"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Transfer or Sell Ticket Pass
                          </button>
                        )}
                      </div>
                    )}

                    {/* SELECT TICKET FOR ACTION */}
                    {transferMode === 'select' && (
                      <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider font-mono">Transfer Setup</h4>
                          <button onClick={() => setTransferMode('none')} className="text-zinc-500 hover:text-white text-[10px] font-mono">Cancel</button>
                        </div>

                        {/* Select which ticket holder */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Select Ticket Holder</label>
                          <div className="space-y-1.5">
                            {(viewingReceipt.data.attendees || [{ name: 'Attendee 1', tier: 'ga' }]).map((att: any, idx: number) => (
                              <button
                                key={`transfer-att-${att?.name || ''}-${idx}`}
                                onClick={() => setTransferringAttendeeIndex(idx)}
                                className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                                  transferringAttendeeIndex === idx
                                    ? 'bg-rose-950/15 border-rose-500 text-white'
                                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                                }`}
                              >
                                <div className="text-xs font-bold">{att?.name}</div>
                                <div className="text-[9px] font-mono uppercase">{att.tier === 'vip_merch' ? 'VIP Merch Pass' : att.tier === 'vip' ? 'VIP Access' : 'GA Pass'}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Select Action */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            onClick={() => setTransferMode('transfer')}
                            className="bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs py-3 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-1"
                          >
                            <UserPlus className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] mt-0.5">Gift To Friend</span>
                            <span className="text-[8px] text-zinc-500 font-normal">Free Secure Transfer</span>
                          </button>

                          <button
                            onClick={() => setTransferMode('resell')}
                            className="bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs py-3 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-1"
                          >
                            <Tag className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] mt-0.5">Resell Ticket</span>
                            <span className="text-[8px] text-zinc-500 font-normal">Set Price & Sell</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* GIFT PASS TO FRIEND */}
                    {transferMode === 'transfer' && (
                      <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <div className="text-xs font-black text-zinc-300 uppercase tracking-wider font-mono">Gift Pass #{(transferringAttendeeIndex + 1)}</div>
                          <button onClick={() => setTransferMode('select')} className="text-rose-500 hover:text-rose-400 text-[10px] font-mono">Back</button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">Friend's Email or Phone</label>
                            <input
                              type="text"
                              placeholder="friend@nexus.com"
                              value={transferRecipient}
                              onChange={(e) => setTransferRecipient(e.target.value)}
                              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">Gift Message (Optional)</label>
                            <input
                              type="text"
                              placeholder="Have fun at the show!"
                              value={transferMessage}
                              onChange={(e) => setTransferMessage(e.target.value)}
                              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          <button
                            onClick={() => handleTicketAction('transfer')}
                            disabled={!transferRecipient.trim()}
                            className="w-full mt-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold text-xs uppercase py-3 rounded-xl transition-all"
                          >
                            Confirm Free Secure Transfer
                          </button>
                        </div>
                      </div>
                    )}

                    {/* LIST PASS FOR RESALE */}
                    {transferMode === 'resell' && (
                      <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <div className="text-xs font-black text-zinc-300 uppercase tracking-wider font-mono">Resell Pass #{(transferringAttendeeIndex + 1)}</div>
                          <button onClick={() => setTransferMode('select')} className="text-rose-500 hover:text-rose-400 text-[10px] font-mono">Back</button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">Set New Sell Price ($)</label>
                            <input
                              type="number"
                              placeholder="35"
                              value={resellPrice}
                              onChange={(e) => setResellPrice(e.target.value)}
                              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                            />
                            <p className="text-[8px] text-zinc-500 mt-0.5">Recommended list price for GA is $25-$45.</p>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">Payment Instructions / Acquire Funds</label>
                            <input
                              type="text"
                              placeholder="CashApp $MyNexusHandle, Venmo @Handle, etc."
                              value={resellPaymentInfo}
                              onChange={(e) => setResellPaymentInfo(e.target.value)}
                              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                            />
                            <p className="text-[8px] text-zinc-500 mt-1 leading-normal">
                              * You are responsible for acquiring external funds from the buyer. Once direct checkout payment verifies, escrow completes automatically.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono block">Resell Method</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setResellMethod('marketplace')}
                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border uppercase ${
                                  resellMethod === 'marketplace' ? 'bg-rose-950/20 border-rose-500 text-rose-400' : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                                }`}
                              >
                                Marketplace List
                              </button>
                              <button
                                onClick={() => setResellMethod('private')}
                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border uppercase ${
                                  resellMethod === 'private' ? 'bg-rose-950/20 border-rose-500 text-rose-400' : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                                }`}
                              >
                                Direct Private Link
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleTicketAction('resell')}
                            disabled={!resellPrice}
                            className="w-full mt-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold text-xs uppercase py-3 rounded-xl transition-all"
                          >
                            List Ticket Pass on Board
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {viewingReceipt.type === 'merch' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                        {viewingReceipt.data.thumbnail ? (
                          <img src={viewingReceipt.data.thumbnail} alt={viewingReceipt.data.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-zinc-600" /></div>
                        )}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white leading-tight">{viewingReceipt.data.name}</div>
                        <div className="text-sm text-rose-400 mt-1 font-mono">${viewingReceipt.data.price?.toFixed(2) || '0.00'}</div>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Order ID</span>
                        <span className="text-sm text-white font-mono">{viewingReceipt.id.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Date</span>
                        <span className="text-sm text-white">{new Date(viewingReceipt.date).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Quantity</span>
                        <span className="text-sm text-white">{viewingReceipt.quantity}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total</span>
                        <span className="text-lg text-rose-400 font-black">${((viewingReceipt.data.price || 0) * viewingReceipt.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};
