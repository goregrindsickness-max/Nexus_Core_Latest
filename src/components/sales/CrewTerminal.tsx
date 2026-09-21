import React, { useState, useEffect } from 'react';
import { EventLineup } from '../../types';
import BluetoothHardwareManager from './BluetoothHardwareManager';

interface CrewTerminalProps {
  ticketingEventId: string;
  lineups: EventLineup[];
  localSalesList: any[];
  setLocalSalesList?: (newList: any[]) => void;
  redeemedTickets: Record<string, boolean>;
  handleToggleRedeem: (saleId: string) => void;
  isCrewTerminalActive: boolean;
  setIsCrewTerminalActive: (active: boolean) => void;
  playLocalBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
  triggerNotification?: (msg: string) => void;
  isDoorCrewOnly?: boolean;
}

export default function CrewTerminal({
  ticketingEventId,
  lineups,
  localSalesList,
  setLocalSalesList,
  redeemedTickets,
  handleToggleRedeem,
  isCrewTerminalActive,
  setIsCrewTerminalActive,
  playLocalBeep,
  triggerNotification,
  isDoorCrewOnly
}: CrewTerminalProps) {

  const handleBluetoothTicketScan = (code: string) => {
    const showSales = localSalesList.filter(s => s.show_id === ticketingEventId);
    
    // Attempt list matches by ticket ID first, then by exact customer email, then by partial names
    const matched = showSales.find(s => 
      s.id.toLowerCase() === code.trim().toLowerCase() ||
      s.customer_email.toLowerCase() === code.trim().toLowerCase() ||
      s.customer_email.split('@')[0].toLowerCase() === code.trim().toLowerCase()
    );

    if (matched) {
      handleToggleRedeem(matched.id);
      const wasRedeemed = !!redeemedTickets[matched.id];
      const actionName = wasRedeemed ? 'CANCELLED REDEMPTION [GUEST EXITED]' : 'AUTHORIZED [GUEST ENTRY APPROVED]';
      if (triggerNotification) {
        triggerNotification(`✓ [SCAN SUCCESS] ${actionName}: ${matched.customer_email.split('@')[0].toUpperCase()}`);
      }
      if (playLocalBeep) {
        playLocalBeep(wasRedeemed ? 440 : 1200, 'sine', 0.15);
      }
    } else {
      if (triggerNotification) {
        triggerNotification(`⚠️ [SCAN ERROR] Barcode "${code}" does not map to any active credential in this database.`);
      }
      if (playLocalBeep) {
        playLocalBeep(180, 'sawtooth', 0.45);
      }
    }
  };

  const handleBluetoothTakePayment = (amount: number, cardholder: string) => {
    let salesArray: any[] = [];
    try {
      const saved = localStorage.getItem('nexus_core_sales_offline');
      salesArray = saved ? JSON.parse(saved) : [];
    } catch (_) {}

    const newSale = {
      id: `TXN-BT-${Math.floor(Math.random() * 900000 + 100000)}`,
      show_id: ticketingEventId,
      customer_email: `${cardholder.toLowerCase().replace(/\s+/g, '') || 'bluetooth.guest'}@door-terminal.com`,
      item_name: `GA DOOR ACCESS_TICKET`,
      quantity: "1",
      price_paid: amount.toString(),
      purchased_at: new Date().toISOString(),
      band_name: ''
    };

    const updated = [newSale, ...salesArray];
    localStorage.setItem('nexus_core_sales_offline', JSON.stringify(updated));
    
    if (setLocalSalesList) {
      setLocalSalesList(updated);
    }

    // Fire storage sync event across open tabs
    window.dispatchEvent(new Event('storage'));

    if (triggerNotification) {
      triggerNotification(`💳 Cover charge of $${amount.toFixed(2)} processed for ${cardholder}! Ticket synced on gate list.`);
    }
  };

  return (
    <div className="w-full border border-amber-500/30 bg-black/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-2xl space-y-4 text-center" id="door-companion-tablet-dock">
      {!isDoorCrewOnly && (
        <div className="flex flex-col md:items-center justify-center gap-4 border-b border-zinc-900 pb-4 text-center">
          <div className="space-y-1">
            <h3 
              style={{ fontSize: '24px', textAlign: 'center', marginBottom: '4px', paddingRight: '0px', paddingLeft: '10px' }}
              className="text-xl sm:text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-450 to-yellow-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.55)] tracking-widest uppercase flex items-center justify-center gap-2"
            >
              Door Crew Mode
            </h3>
            <p 
              style={{ textAlign: 'center' }}
              className="text-xs text-zinc-400 font-sans leading-relaxed text-center"
            >
              Lock this device or hand a second synchronized device to door staff with high-contrast buyer lookup, real-time occupancy meters, and click-redemption logs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCrewTerminalActive(true);
              if (typeof playLocalBeep === 'function') {
                playLocalBeep(440, 'sine', 0.1);
              }
            }}
            className="px-6 py-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase font-black rounded-xl cursor-pointer transition-all duration-200 shrink-0 shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2 font-bold hover:scale-[1.02] active:scale-95"
          >
            ⚙️ LAUNCH CREW DOOR WORKSPACE
          </button>
        </div>
      )}

      {/* OVERLAY INTERFACE */}
      {(isCrewTerminalActive || isDoorCrewOnly) && (
        <div className="fixed inset-0 z-[200] bg-[#07080a] flex flex-col font-mono text-zinc-300">
            {(() => {
              const showSales = localSalesList.filter(s => s.show_id === ticketingEventId);
              const eventName = ticketingEventId === 'demo-sandbox' ? 'SANDBOX DEMO' : (lineups.find(l => l.id === ticketingEventId)?.name || 'N/A');
              
              const totalTicketsBought = showSales.reduce((sum, s) => sum + (parseInt(s.quantity) || 1), 0);
              const redeemedCount = showSales.filter(s => redeemedTickets[s.id]).reduce((sum, s) => sum + (parseInt(s.quantity) || 1), 0);

              return (
                <div className="flex-grow flex flex-col min-h-0 bg-black text-white" id="crew-terminal-dashboard-wrapper">
                  <div className="bg-[#090b0e] border-b border-zinc-900 px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl animate-pulse">📡</span>
                      <div className="text-left">
                        <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded text-amber-550 font-bold uppercase tracking-widest font-mono">
                          COMPANION DOOR SCAN TERMINAL
                        </span>
                        <h1 className="text-sm font-black text-white uppercase font-mono tracking-tight mt-1 max-w-sm sm:max-w-md truncate">
                          {eventName}
                        </h1>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs">
                      <div className="text-right text-zinc-400">
                        <span>OCCUPANCY RATE</span>
                        <strong className="block text-[#00ffcc] text-lg font-black mt-0.5 animate-pulse">
                          {redeemedCount} / {totalTicketsBought} INSIDE
                        </strong>
                      </div>
                      {!isDoorCrewOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCrewTerminalActive(false);
                            if (playLocalBeep) playLocalBeep(330, 'sine', 0.05);
                          }}
                          className="px-4 py-2 border border-red-900 hover:bg-red-950/20 text-red-400 text-xs uppercase font-black tracking-widest rounded-xl flex items-center justify-center cursor-pointer"
                        >
                          EXIT DOOR RUNNER
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dual Panel Split Client Area */}
                  <div className="flex-grow flex flex-col lg:flex-row min-h-0 bg-black">
                    
                    {/* LEFT ROW: GUEST DATABASE LOOKUP */}
                    <div className="flex-1 flex flex-col min-h-0 border-r border-[#151b27]">
                      
                      <div className="p-4 bg-[#0a0c10] border-b border-zinc-900 shrink-0">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500 text-base">🔍</span>
                          <input 
                            type="text"
                            id="crew-door-search"
                            placeholder="LOOKUP BUYERS BY NAME, ATTRIBUTOR, EMAIL..."
                            onChange={(e) => {
                              const text = e.target.value.toLowerCase();
                              const els = document.querySelectorAll('[data-door-row]');
                              els.forEach(el => {
                                const tags = (el.getAttribute('data-door-row') || '').toLowerCase();
                                if (tags.includes(text)) {
                                  el.classList.remove('hidden');
                                } else {
                                  el.classList.add('hidden');
                                }
                              });
                            }}
                            className="w-full bg-black pl-10 pr-4 py-3 border border-zinc-800 rounded-xl text-xs sm:text-sm font-mono text-white tracking-wider placeholder-zinc-700 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {showSales.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center py-24 text-zinc-650 space-y-2">
                            <span className="text-3xl">🎫</span>
                            <span className="text-xs font-black uppercase tracking-wide">NO TICKETS BOUGHT FOR THIS EVENT YET</span>
                            <p className="text-xs text-zinc-550 max-w-sm leading-relaxed">Use the payment storefront simulator above to run mock purchases and see them populate here in real-time!</p>
                          </div>
                        ) : (
                          showSales.map((t, tIdx) => {
                            const isRedeemed = !!redeemedTickets[t.id];
                            const rowTags = `${t.customer_email} ${t.item_name} ${t.band_name || ''} ${t.id}`.toLowerCase();
                            return (
                              <div 
                                key={`door-item-${t.id}-${tIdx}`}
                                data-door-row={rowTags}
                                className={`p-4 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                                  isRedeemed 
                                    ? 'bg-zinc-950/40 border-emerald-950/20 text-zinc-500 opacity-60' 
                                    : 'bg-[#0f1115] border-zinc-800 text-white shadow-xl'
                                }`}
                              >
                                <div className="text-left min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold font-mono">
                                      👤 {t.customer_email.split('@')[0].toUpperCase()}
                                    </span>
                                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400 shrink-0 uppercase tracking-widest font-mono">
                                      {t.item_name}
                                    </span>
                                    {t.band_name && (
                                      <span className="text-[10px] bg-purple-950 border border-purple-900/30 px-2 py-0.5 rounded text-purple-300 shrink-0 uppercase tracking-widest font-mono font-bold">
                                        🎸 Referral: {t.band_name}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-zinc-500 font-mono mt-1.5 truncate leading-none">
                                    EMAIL: <span className="text-zinc-400 font-sans">{t.customer_email}</span> • TXN_ID: <span className="font-mono text-[9px] text-zinc-500">{t.id}</span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto">
                                  <div className="text-right shrink-0 font-mono">
                                    <span className="text-[10px] text-zinc-500 block uppercase">Qty: <strong className="text-white font-mono text-xs">{t.quantity}</strong></span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRedeem(t.id)}
                                    className={`px-5 py-3 text-xs font-mono tracking-widest uppercase font-black transition-all border rounded-xl min-h-[44px] ${
                                      isRedeemed 
                                        ? 'bg-zinc-900 border-emerald-500/20 text-[#00ffcc]/60 hover:bg-zinc-950 cursor-pointer' 
                                        : 'bg-emerald-500 hover:bg-[#00ffcc] text-black border-transparent font-black shadow-md shadow-emerald-900/20 cursor-pointer'
                                    }`}
                                  >
                                    {isRedeemed ? '✓ REDEEMED' : '[ REDEEM TICKET ]'}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>

                    {/* RIGHT ROW: WIRELESS HARDWARE CONTROLLER PANEL */}
                    <div className="w-full lg:w-[460px] xl:w-[500px] border-t lg:border-t-0 lg:border-l border-zinc-900 bg-[#07090d] flex flex-col p-4 overflow-y-auto shrink-0 custom-scrollbar space-y-4">
                      <div className="bg-[#10141f] border border-[#1e293b] p-4 rounded-xl space-y-1 text-left">
                        <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest font-mono">GATE HOUSE PERIPHERALS</span>
                        <h4 className="text-xs font-bold text-white uppercase font-mono">Hardware Integration Station</h4>
                        <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed">
                          Synchronize physical or simulated Bluetooth accessories to automate ticket check-ins and payments at the venue entry.
                        </p>
                      </div>

                      <BluetoothHardwareManager
                        onScanTicket={handleBluetoothTicketScan}
                        onTakePayment={handleBluetoothTakePayment}
                        triggerNotification={triggerNotification}
                        playLocalBeep={playLocalBeep}
                      />
                    </div>

                  </div>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
}
