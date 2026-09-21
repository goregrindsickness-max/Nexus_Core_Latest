import React, { useState, useEffect, useRef } from 'react';
import MarqueeText from '../../MarqueeText';

interface DoorCrewWorkspaceProps {
  onClose: () => void;
  triggerNotification?: (msg: string) => void;
  playLocalBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

type Ticket = {
  id: string;
  name: string;
  sku: string;
  variant: string;
  scanned: boolean;
};

const initialTickets: Ticket[] = [
  { id: '1', name: 'Justin Mason', sku: 'SKU-DEMO-GEN-501', variant: 'General Admission', scanned: false },
  { id: '2', name: 'Sarah Jenkins', sku: 'SKU-DEMO-VIP-102', variant: 'VIP Meet & Greet', scanned: true },
  { id: '3', name: 'Michael Chen', sku: 'SKU-DEMO-GEN-502', variant: 'General Admission', scanned: false },
  { id: '4', name: 'Emily Davis', sku: 'SKU-DEMO-VIP-103', variant: 'VIP Meet & Greet', scanned: false },
  { id: '5', name: 'Alex Rodriguez', sku: 'SKU-DEMO-GEN-503', variant: 'General Admission', scanned: false },
];

export default function DoorCrewWorkspace({ 
  onClose,
  triggerNotification = () => {},
  playLocalBeep = () => {}
}: DoorCrewWorkspaceProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [bluetoothScanning, setBluetoothScanning] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState('');
  const [doorSales, setDoorSales] = useState(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const totalCapacity = 300;
  const totalTickets = tickets.length;
  const scannedTickets = tickets.filter(t => t.scanned).length;
  const insideOccupancy = scannedTickets + doorSales;
  const scannedRatio = totalTickets > 0 ? Math.round((scannedTickets / totalTickets) * 100) : 0;
  const doorCashPrice = 25.00;
  const doorCashFloat = doorSales * doorCashPrice;

  const filteredTickets = tickets.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleScan = (id: string) => {
    setTickets(tickets.map(t => {
      if (t.id === id) {
        const newlyScanned = !t.scanned;
        if (newlyScanned) {
          triggerNotification(`✅ [ENTRY AUTHORIZED] ${t.name} (${t.variant}) checked in.`);
          playLocalBeep(1200, 'sine', 0.15);
        } else {
          triggerNotification(`⚠️ [UNDO REDEMPTION] ${t.name} check-in cancelled.`);
          playLocalBeep(440, 'sine', 0.15);
        }
        return { ...t, scanned: newlyScanned };
      }
      return t;
    }));
  };

  // Programmatic Background Scan Capture Hook
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Focus hidden input on any keypress if we're not already typing in an input
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        hiddenInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScanBuffer(e.target.value);
  };

  const handleHiddenInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const payload = scanBuffer.trim();
      if (payload) {
        console.log('Bluetooth Scan Payload Intercepted:', payload);
        // Execute verification hook here
        const ticket = tickets.find(t => t.sku.toLowerCase() === payload.toLowerCase());
        if (ticket) {
          if (!ticket.scanned) {
            toggleScan(ticket.id);
          } else {
            triggerNotification(`❌ [DUPLICATE SCAN] Ticket for ${ticket.name} is already redeemed!`);
            playLocalBeep(180, 'sawtooth', 0.45);
          }
        } else {
          triggerNotification(`❌ [INVALID SCAN] SKU ${payload} not found in database!`);
          playLocalBeep(180, 'sawtooth', 0.45);
        }
        
        // Clear buffer
        setScanBuffer('');
        if (hiddenInputRef.current) {
          hiddenInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className="w-full h-full bg-neutral-950 text-amber-500 border border-zinc-900 font-mono flex flex-col">
      {/* Hidden Form Listener */}
      <input
        ref={hiddenInputRef}
        id="sandbox-hardware-scan-buffer"
        type="text"
        value={scanBuffer}
        onChange={handleHiddenInputChange}
        onKeyDown={handleHiddenInputKeyDown}
        className="opacity-0 absolute top-0 left-0 pointer-events-none w-0 h-0"
        autoFocus
        tabIndex={-1}
      />
      
      {/* Root Component Frame & Header Setup */}
      <div className="flex justify-between items-center p-3 border-b border-zinc-900 shrink-0">
        <span className="font-black tracking-widest text-sm uppercase">⚡ CREW TERMINAL MODE // TACTICAL ACCESS CONTROL</span>
        <button 
          onClick={onClose}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono text-xs px-3 py-1.5 rounded transition-colors"
        >
          ❌ CLOSE PORTAL
        </button>
      </div>

      {/* Marquee & Sync Bar */}
      <div className="flex flex-col border-b border-zinc-900 bg-black shrink-0">
        <div className="flex items-center px-4 py-2 border-b border-zinc-900/50">
           <MarqueeText 
             text="✦ LIVE TACTICAL TERMINAL ACTIVE ✦ DOORS OPEN ✦ NO WEAPONS ✦ ALL GUEST LISTS SYNCED ✦" 
             className="text-yellow-500 font-black tracking-[0.2em] text-[10px] uppercase" 
           />
        </div>
        <div className="flex items-center justify-between p-3">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">NETWORK: SECURE</span>
          <button 
            onClick={() => {
              triggerNotification('🔄 Syncing local ticket database...');
              playLocalBeep(880, 'sine', 0.1);
            }}
            className="bg-emerald-950/40 text-emerald-500 border border-emerald-900 hover:bg-emerald-900/50 text-xs font-mono font-bold px-4 py-1.5 rounded transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE SYNC
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Re-Architected Apex Metric & Audit Module */}
        <div className="flex flex-col gap-2 p-3 bg-zinc-950/20 border-b border-zinc-900 mb-3">
          {/* Layer 1 (The Venue Safety Ceiling) */}
          <div className="text-sm font-mono tracking-wider text-amber-500 font-black bg-zinc-950 p-2 rounded border border-zinc-900 text-center">
            🔥 INSIDE CAPACITY: {insideOccupancy} / {totalCapacity}
          </div>
          
          {/* Layer 2 (The Audit Split Grid) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase text-left">ONLINE REDEEMED</span>
              <span className="text-sm font-mono font-bold text-zinc-300 text-left">{scannedTickets} / {totalTickets} SCAN</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase text-right">DOOR CASH BOX AUDIT</span>
              <span className="text-sm font-mono font-bold text-emerald-400 text-right">{doorSales} SOLD (${doorCashFloat.toFixed(2)})</span>
            </div>
          </div>
          
          {/* Layer 3 (Offline Sync Buffer) */}
          <div className="text-[9px] font-mono text-zinc-500 text-center w-full bg-zinc-950 py-1 rounded border border-zinc-900/60 mt-1">
            [ SYNC BUFFER: 0 QTY ]
          </div>
        </div>

        {/* Dual Scan Control Drawer Component */}
        <div className="space-y-2 mb-3">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 LOOKUP BUYERS BY NAME, SKU, OR EMAIL..." 
            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm font-mono text-amber-500 placeholder-zinc-700 rounded-lg focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                setCameraActive(!cameraActive);
                playLocalBeep(cameraActive ? 330 : 660, 'square', 0.1);
                triggerNotification(cameraActive ? '📷 Camera scanner disabled.' : '📷 Camera scanner activated.');
              }}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono py-2 rounded-md font-bold transition-all hover:bg-zinc-800 cursor-pointer"
            >
              📷 CAMERA SCANNER
            </button>
            <button 
              onClick={() => {
                hiddenInputRef.current?.focus();
                setBluetoothScanning(true);
                setTimeout(() => setBluetoothScanning(false), 1500);
                triggerNotification('🔊 Bluetooth scanner ready. Waiting for input...');
                playLocalBeep(880, 'sine', 0.1);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono py-2 rounded-md font-bold transition-all hover:bg-zinc-800 cursor-pointer"
            >
              {bluetoothScanning ? '📡 READING GUN...' : '🔊 BLUETOOTH TERMINAL'}
            </button>
          </div>
        </div>

        {cameraActive && (
          <div className="w-full max-w-md mx-auto aspect-video border border-amber-500/30 bg-zinc-950 rounded-lg relative overflow-hidden flex items-center justify-center mb-3">
            <span className="text-zinc-600 animate-pulse text-xs tracking-widest">[ HARDWARE CAMERA ACTIVE ]</span>
          </div>
        )}

        {/* Dynamic Roster List & Manual Clearance Deck */}
        <button 
          onClick={() => {
            setDoorSales(prev => prev + 1);
            triggerNotification('💵 Quick Cash Door Sale processed successfully.');
            playLocalBeep(880, 'sine', 0.1);
          }}
          className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs py-2 rounded-md font-mono uppercase mb-2 cursor-pointer transition-colors"
        >
          ➕ QUICK DOOR CASH TICKET SALE
        </button>

        <div className="space-y-1">
          {filteredTickets.map((ticket, idx) => (
            <div 
              key={`${ticket.id}-${idx}`} 
              className={`flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors ${ticket.scanned ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col">
                <span className={`text-amber-100 font-bold text-sm tracking-tight ${ticket.scanned ? 'line-through' : ''}`}>
                  {ticket.name}
                </span>
                <span className={`text-[10px] text-zinc-500 mt-0.5 ${ticket.scanned ? 'line-through' : ''}`}>
                  [{ticket.sku}] // {ticket.variant}
                </span>
              </div>
              
              {!ticket.scanned ? (
                <button 
                  onClick={() => toggleScan(ticket.id)}
                  className="bg-zinc-900 text-amber-500 border border-zinc-800 font-mono text-[10px] px-3 py-1.5 rounded cursor-pointer hover:bg-zinc-800 transition-colors shrink-0"
                >
                  🔲 MARK IN
                </button>
              ) : (
                <button 
                  onClick={() => toggleScan(ticket.id)}
                  className="bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] px-3 py-1.5 rounded line-through shrink-0"
                >
                  ✅ INSIDE
                </button>
              )}
            </div>
          ))}
          
          {filteredTickets.length === 0 && (
            <div className="py-8 text-center text-zinc-600 text-xs tracking-widest uppercase">
              No matching tickets found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
