import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bluetooth, 
  Printer, 
  QrCode, 
  CreditCard, 
  Cpu, 
  Power, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  ListRestart, 
  HardDrive, 
  TrendingUp,
  X,
  FileText
} from 'lucide-react';

export interface BTDevice {
  id: string;
  name: string;
  type: 'scanner' | 'printer' | 'card_reader';
  macAddress: string;
  battery: number;
  status: 'disconnected' | 'connecting' | 'connected';
  signal: number; // dBm
  hardwareInfo: string;
}

interface BluetoothHardwareManagerProps {
  onScanTicket?: (ticketIdOrEmail: string) => void;
  onTakePayment?: (amount: number, cardHolder: string) => void;
  triggerNotification?: (msg: string) => void;
  playLocalBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

export default function BluetoothHardwareManager({
  onScanTicket,
  onTakePayment,
  triggerNotification,
  playLocalBeep
}: BluetoothHardwareManagerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [apiSupported, setApiSupported] = useState(false);
  const [hardwareLogs, setHardwareLogs] = useState<{ id: string; time: string; source: string; msg: string; type: 'info' | 'success' | 'warn' }[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'diagnostics' | 'prints'>('status');
  const [printedReceipts, setPrintedReceipts] = useState<{ id: string; timestamp: string; content: string[] }[]>([]);
  
  // Persisted devices
  const [devices, setDevices] = useState<BTDevice[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_gate_bt_devices');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return [
      {
        id: 'sk-s700',
        name: 'Socket Mobile S700 Scanner',
        type: 'scanner',
        macAddress: 'E4:12:4B:92:DF:D1',
        battery: 88,
        status: 'disconnected',
        signal: -65,
        hardwareInfo: 'Laser CCD BT 5.1 Host, Autocontrol Mode'
      },
      {
        id: 'pr-sm230',
        name: 'Star SM-S230i ESC/POS Printer',
        type: 'printer',
        macAddress: '00:1E:C0:AE:52:19',
        battery: 100,
        status: 'disconnected',
        signal: -58,
        hardwareInfo: 'Thermal Roll 58mm, ESC/POS Emulation'
      },
      {
        id: 'cr-chipper',
        name: 'BBPOS Chipper 2X Payment Terminal',
        type: 'card_reader',
        macAddress: '23:D1:4F:A3:BB:06',
        battery: 62,
        status: 'disconnected',
        signal: -73,
        hardwareInfo: 'EMV Contactless & Magstripe NFC BT'
      }
    ];
  });

  // Track discovered air devices during a search
  const [discoveredDevices, setDiscoveredDevices] = useState<BTDevice[]>([]);

  // Simulation input values
  const [testScanInput, setTestScanInput] = useState('');
  const [manualChargeAmount, setManualChargeAmount] = useState('15.00');
  const [manualChargeName, setManualChargeName] = useState('JAMES HOLDEN');

  useEffect(() => {
    // Check Web Bluetooth support
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      setApiSupported(true);
    }
    // Set up standard initial log
    addHardwareLog('System', 'Bluetooth Accessory subsystem initialized successfully. Ready to bind door hardware.', 'info');
  }, []);

  // Save devices to store when updated
  useEffect(() => {
    try {
      localStorage.setItem('nexus_gate_bt_devices', JSON.stringify(devices));
    } catch (_) {}
  }, [devices]);

  const addHardwareLog = (source: string, msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setHardwareLogs(prev => [
      { id: `${Date.now()}-${Math.random()}`, time, source, msg, type },
      ...prev.slice(0, 49) // maximum 50 logs
    ]);
  };

  const handleStartScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setDiscoveredDevices([]);
    addHardwareLog('System', 'Pulsing BLE physical inquiry scan (Scanning 2.4GHz spectrum)...', 'info');
    if (playLocalBeep) playLocalBeep(650, 'triangle', 0.1);

    // Dynamic scanner mock discovery loop
    setTimeout(() => {
      // Find what can be added
      const mockPool: BTDevice[] = [
        {
          id: 'sk-cs60',
          name: 'Zebra CS60-HC Companion Scanner',
          type: 'scanner',
          macAddress: '8C:11:F2:77:4A:11',
          battery: 95,
          status: 'disconnected',
          signal: -62,
          hardwareInfo: 'Megapixel Area Imager standard 2D'
        },
        {
          id: 'pr-t20',
          name: 'Epson TM-P20 Ultra Portable POS',
          type: 'printer',
          macAddress: 'F8:45:C2:22:90:DE',
          battery: 45,
          status: 'disconnected',
          signal: -77,
          hardwareInfo: 'ESC/POS Line Direct Thermal 203 DPI'
        },
        {
          id: 'cr-stripe',
          name: 'Stripe Reader M2 Smart Node',
          type: 'card_reader',
          macAddress: 'AA:BB:CC:DD:EE:0F',
          battery: 100,
          status: 'disconnected',
          signal: -50,
          hardwareInfo: 'PCI-PTS 5.x, Bluetooth LE Gateway'
        }
      ];

      // Add one or two to discovered pool
      setDiscoveredDevices(mockPool);
      addHardwareLog('System', `Finished scanning. Discovered ${mockPool.length} active BLE devices nearby.`, 'success');
      setIsScanning(false);
      if (triggerNotification) triggerNotification('⚡ Bluetooth Inquiry complete: Hardware found!');
    }, 2200);
  };

  // Try real bluetooth API scan if possible
  const handleNativeBluetoothRequest = async () => {
    if (!apiSupported) {
      addHardwareLog('System', 'Web Bluetooth API is unsupported or restricted by this environment frame.', 'warn');
      return;
    }
    try {
      addHardwareLog('API', 'Requesting native OS Bluetooth prompt...', 'info');
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true
      });
      addHardwareLog('API', `OS Paired with native device: ${device.name || 'Unnamed'} (${device.id})`, 'success');
      
      // Map native device
      const newD: BTDevice = {
        id: device.id,
        name: device.name || 'Generic BLE Peripheral',
        type: 'scanner', // Assume scanner or customize
        macAddress: 'NATIVE-OS-BLE',
        battery: 100,
        status: 'connected',
        signal: -50,
        hardwareInfo: 'Web Bluetooth Native Bind'
      };
      
      setDevices(prev => {
        if ((prev || []).some(d => d.id === newD.id)) return prev;
        return [...prev, newD];
      });

    } catch (err: any) {
      addHardwareLog('API', `Inquiry rejected or stopped: ${err.message || err}`, 'warn');
    }
  };

  const handleConnectDevice = (deviceId: string, isDiscovered: boolean = false) => {
    const listToSearch = isDiscovered ? discoveredDevices : devices;
    const found = listToSearch.find(d => d.id === deviceId);
    if (!found) return;

    addHardwareLog(found.name, `Initiating handshake connection sequence...`, 'info');
    
    // Update state to connecting
    setDevices(prev => {
      const isAlreadyInSaved = (prev || []).some(d => d.id === deviceId);
      if (isAlreadyInSaved) {
        return prev.map(d => d.id === deviceId ? { ...d, status: 'connecting' } : d);
      } else {
        // Add to saved devices list
        return [...prev, { ...found, status: 'connecting' }];
      }
    });

    if (playLocalBeep) playLocalBeep(880, 'sine', 0.15);

    setTimeout(() => {
      setDevices(prev => prev.map(d => {
        if (d.id === deviceId) {
          addHardwareLog(d.name, `🎉 Connection established (Signal: ${d.signal}dBm, Batt: ${d.battery}%). Port open.`, 'success');
          if (triggerNotification) triggerNotification(`Connected to ${d.name}!`);
          if (playLocalBeep) playLocalBeep(1200, 'sine', 0.2);
          return { ...d, status: 'connected' };
        }
        return d;
      }));

      // Remove from discovered list if added
      if (isDiscovered) {
        setDiscoveredDevices(prev => prev.filter(d => d.id !== deviceId));
      }
    }, 1200);
  };

  const handleDisconnectDevice = (deviceId: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        addHardwareLog(d.name, 'Disconnect initiated. Port closed gracefully.', 'warn');
        if (triggerNotification) triggerNotification(`Disconnected ${d.name}`);
        if (playLocalBeep) playLocalBeep(330, 'sine', 0.1);
        return { ...d, status: 'disconnected' };
      }
      return d;
    }));
  };

  const handleRemoveSavedDevice = (deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    addHardwareLog('System', `Removed hardware configuration binding: ${deviceId}`, 'info');
  };

  // Simulated Interactions
  const handleSimulateScan = (overrideCode?: string) => {
    const code = overrideCode || testScanInput.trim();
    if (!code) {
      if (triggerNotification) triggerNotification('Enter a ticket ID or customer email to simulate a barcode scan!');
      return;
    }

    const scanner = devices.find(d => d.type === 'scanner' && d.status === 'connected');
    if (!scanner) {
      if (triggerNotification) triggerNotification('⚠️ Laser Scanner is offline! Please connect a scanner device to enable trigger simulation.');
      addHardwareLog('System', 'Simulated barcode fail: Scanner offline.', 'warn');
      return;
    }

    addHardwareLog(scanner.name, `Laser Beam scanning barcode value: "${code}"`, 'info');
    if (playLocalBeep) playLocalBeep(2000, 'sine', 0.08);

    if (onScanTicket) {
      onScanTicket(code);
      addHardwareLog(scanner.name, `Decoded barcode sent to Door Gate Terminal logic.`, 'success');
      setTestScanInput('');
    }
  };

  const handleSimulatePayment = () => {
    const amt = parseFloat(manualChargeAmount);
    if (isNaN(amt) || amt <= 0) {
      if (triggerNotification) triggerNotification('Enter a valid charge amount!');
      return;
    }

    const reader = devices.find(d => d.type === 'card_reader' && d.status === 'connected');
    if (!reader) {
      if (triggerNotification) triggerNotification('⚠️ Card Reader is offline! Please connect a terminal reader to swipe cards.');
      return;
    }

    addHardwareLog(reader.name, `Waiting for Card Tap/Swipe/Insert for $${amt.toFixed(2)} USD...`, 'info');
    if (playLocalBeep) playLocalBeep(600, 'triangle', 0.2);

    setTimeout(() => {
      if (onTakePayment) {
        onTakePayment(amt, manualChargeName.toUpperCase() || 'MANUAL GUEST');
        addHardwareLog(reader.name, `💳 Authorization Approved! Batch ID: #TX-${Math.floor(Math.random() * 900000 + 100000)}. Cardholder: ${manualChargeName.toUpperCase()}`, 'success');
        if (triggerNotification) triggerNotification(`Payment of $${amt.toFixed(2)} processed successfully!`);
        if (playLocalBeep) playLocalBeep(1200, 'sine', 0.3);
      }
    }, 1500);
  };

  const handleSimulatePrintReceipt = (customTitle: string = 'NEXUS DOOR TICKET STUB', details: string[] = []) => {
    const printer = devices.find(d => d.type === 'printer' && d.status === 'connected');
    if (!printer) {
      if (triggerNotification) triggerNotification('⚠️ Printer is offline! Connection required to issue printed logs.');
      return;
    }

    addHardwareLog(printer.name, `Receiving ESC/POS buffer (Job size: 240 bytes)...`, 'info');
    if (playLocalBeep) playLocalBeep(1400, 'sine', 0.05);

    setTimeout(() => {
      const now = new Date();
      const jobLines = [
        '--------------------------------',
        '       NEXUS CORE SYSTEM       ',
        `      ${customTitle}     `,
        '--------------------------------',
        `TIMESTAMP: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        `PRINTER: ${printer.name}`,
        `DRIVER_ID: ESC58_NATIVE_V4`,
        ...details,
        '--------------------------------',
        '      GATE STATUS: CONFIRMED    ',
        '      KEEP THIS FOR YOUR LOGS   ',
        '--------------------------------',
      ];

      const newReceipt = {
        id: `rcpt-${Date.now()}`,
        timestamp: now.toLocaleTimeString(),
        content: jobLines
      };

      setPrintedReceipts(prev => [newReceipt, ...prev]);
      addHardwareLog(printer.name, `🖨️ Physical thermal feed cut completed successfully.`, 'success');
      if (triggerNotification) triggerNotification(`Printed ticket stub via Star Thermal Printer.`);
      
      // Secondary sound for grinding thermal paper
      if (playLocalBeep) {
        setTimeout(() => playLocalBeep(500, 'sawtooth', 0.15), 100);
        setTimeout(() => playLocalBeep(520, 'sawtooth', 0.1), 300);
      }
    }, 800);
  };

  return (
    <div className="bg-[#0b0e14] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      
      {/* Bluetooth Top Navigation & Pulse Bar */}
      <div className="bg-[#101520] border-b border-zinc-900 px-4 py-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-[#00ffcc]/30 animate-ping"></span>
            <div className="h-6 w-6 rounded-full bg-[#00ffcc]/20 border border-[#00ffcc]/50 flex items-center justify-center">
              <Bluetooth className="w-3.5 h-3.5 text-[#00ffcc] animate-pulse" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black font-mono text-white tracking-widest uppercase">Bluetooth Accessories Gate</h4>
            <p className="text-[9px] text-[#00ffcc] uppercase font-mono tracking-wider font-bold">2.4GHz BLE Peripheral Port</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#080b11] p-1 border border-zinc-900 rounded-lg">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all font-mono ${activeTab === 'status' ? 'bg-[#00ffcc] text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
          >
            Hardware Center
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all font-mono ${activeTab === 'diagnostics' ? 'bg-[#00ffcc] text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
          >
            Diagnostics ({hardwareLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('prints')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all font-mono relative ${activeTab === 'prints' ? 'bg-[#00ffcc] text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
          >
            Prints
            {printedReceipts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#a855f7] text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center animate-bounce border border-black">
                {printedReceipts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Views container */}
      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Hardware Center */}
          {activeTab === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              {/* Scan controller banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#121824] border border-[#232d3f] rounded-xl p-3 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 font-bold block">ACCESSORIES SCANNER</span>
                    <h5 className="text-xs font-bold text-white uppercase font-mono mt-1">Discover hardware over-the-air</h5>
                    <p className="text-[10px] text-zinc-400 font-sans mt-1 leading-normal">
                      Initiate a low-energy search to detect regional Bluetooth barcode scanners, thermal printers, and card readers.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={handleStartScan}
                      className={`px-3.5 py-2 text-[10px] font-black tracking-wider rounded-lg uppercase flex items-center gap-1.5 transition-all font-mono ${
                        isScanning
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                          : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95 cursor-pointer font-bold'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                      {isScanning ? 'Ble Inquiry Active...' : '🔍 Scan for Bluetooth Hardware'}
                    </button>

                    {apiSupported && (
                      <button
                        type="button"
                        onClick={handleNativeBluetoothRequest}
                        className="px-3.5 py-2 border border-[#00ffcc]/35 hover:bg-[#00ffcc]/10 text-[#00ffcc] text-[10px] uppercase font-black tracking-wider rounded-lg transition-all flex items-center gap-1 font-mono"
                      >
                        ⚡ Native Pairing Prompt
                      </button>
                    )}
                  </div>
                </div>

                {/* Simulated Radar Visual Component */}
                <div className="bg-black/40 border border-[#171e29] rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden h-[120px]">
                  {isScanning ? (
                    <div className="absolute inset-0 bg-[#0e2c26]/10 flex items-center justify-center">
                      <div className="relative w-24 h-24 border border-[#00ffcc]/40 rounded-full flex items-center justify-center animate-pulse">
                        <div className="absolute w-16 h-16 border border-[#00ffcc]/20 rounded-full"></div>
                        <div className="absolute w-8 h-8 border border-[#00ffcc]/10 rounded-full"></div>
                        <div className="h-1 bg-gradient-to-r from-transparent via-[#00ffcc] to-transparent w-full transform origin-center rotate-45 animate-spin"></div>
                      </div>
                      <span className="absolute bottom-2 text-[8px] text-[#00ffcc] animate-pulse font-bold tracking-widest font-mono">SCANNING FREQUENCIES...</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-1 z-10">
                      <Activity className={`w-8 h-8 mx-auto text-zinc-650 ${(devices || []).some(d => d.status === 'connected') ? 'text-[#00ffcc] animate-pulse' : ''}`} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block">BLUETOOTH LINK STATUS</span>
                      <p className="text-[11px] font-bold text-white font-mono uppercase">
                        {devices.filter(d => d.status === 'connected').length} Active hardware binds
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* DISCOVERED DEVICES FROM A ACTIVE SCAN */}
              {discoveredDevices.length > 0 && (
                <div className="bg-amber-950/10 border border-amber-900/35 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-amber-900/20 pb-1.5">
                    <span className="text-[9px] text-amber-500 font-black uppercase font-mono tracking-wider flex items-center gap-1">
                      📡 DISCOVERED OUTSTANDING PERIPHERALS ({discoveredDevices.length})
                    </span>
                    <button 
                      onClick={() => setDiscoveredDevices([])}
                      className="text-zinc-500 hover:text-white text-xs font-bold font-mono"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {discoveredDevices.map((d, dIdx) => (
                      <div key={`${d.id}-${dIdx}`} className="bg-[#121620] border border-zinc-800 p-2.5 rounded-lg flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">
                              {d.type === 'scanner' && '🔦'}
                              {d.type === 'printer' && '🖨️'}
                              {d.type === 'card_reader' && '💳'}
                            </span>
                            <h6 className="text-[11px] font-bold text-white truncate font-mono uppercase">{d.name}</h6>
                          </div>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5">MAC: {d.macAddress}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConnectDevice(d.id, true)}
                          className="px-2.5 py-1 bgColor bg-amber-500 hover:bg-amber-400 text-black text-[9px] uppercase font-black font-mono tracking-wider rounded cursor-pointer"
                        >
                          CONNECT / PAIR
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LIST OF REGISTERED DEVICES AND BINDINGS */}
              <div className="space-y-2.5">
                <span className="text-[9px] text-zinc-500 font-black uppercase font-mono tracking-widest block">REGISTERED HARDWARE PROFILE SET</span>
                
                <div className="space-y-2">
                  {devices.map((d, dIdx) => {
                    const isConnected = d.status === 'connected';
                    const isConnecting = d.status === 'connecting';
                    return (
                      <div 
                        key={`${d.id}-${dIdx}`} 
                        className={`p-3 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all ${
                          isConnected 
                            ? 'bg-[#0b171c] border-[#0ea5e9]/30 shadow-md shadow-[#0ea5e9]/5' 
                            : 'bg-[#10141d]/85 border-[#232d3f]'
                        }`}
                      >
                        {/* Device general label & Specs */}
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isConnected ? 'bg-[#0ea5e9]/10 border border-[#0ea5e9]/35 text-[#0ea5e9]' : 'bg-zinc-900 border border-zinc-800 text-zinc-500'}`}>
                            {d.type === 'scanner' && <QrCode className="w-5 h-5" />}
                            {d.type === 'printer' && <Printer className="w-5 h-5" />}
                            {d.type === 'card_reader' && <CreditCard className="w-5 h-5" />}
                          </div>

                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-[12px] font-black text-white hover:text-[#00ffcc] font-mono uppercase truncate">{d.name}</h5>
                              
                              <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-widest ${
                                isConnected 
                                  ? 'bg-[#0ea5e9]/20 border border-[#0ea5e9]/40 text-[#0ea5e9]' 
                                  : isConnecting 
                                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                              }`}>
                                {d.status}
                              </span>
                            </div>
                            <p className="text-[9.5px] text-zinc-500 font-mono mt-1">
                              MAC: <span className="text-zinc-400 font-sans">{d.macAddress}</span> • SIGNAL: <span className="text-[#00ffcc] font-mono">{d.signal} dBm</span> • BATT: <span className="font-sans font-bold text-zinc-400">{d.battery}%</span>
                            </p>
                            <p className="text-[9px] text-zinc-600 font-mono italic mt-0.5">SKU: {d.hardwareInfo}</p>
                          </div>
                        </div>

                        {/* Interactive simulation actions for connected devices */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                          {isConnected && (
                            <div className="bg-black/60 border border-zinc-900 px-2 py-1.5 rounded-lg flex items-center gap-2">
                              {/* Scanner simulation input */}
                              {d.type === 'scanner' && (
                                <div className="flex items-center gap-1.5">
                                  <input 
                                    type="text"
                                    placeholder="Sim barcode..."
                                    value={testScanInput}
                                    onChange={(e) => setTestScanInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSimulateScan()}
                                    className="bg-black text-[10px] h-7 w-28 px-2 border border-zinc-800 rounded placeholder-zinc-700 font-mono lowercase"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSimulateScan()}
                                    className="bg-[#0ea5e9] hover:bg-[#00ffcc] text-black text-[9px] h-7 px-2.5 font-black uppercase font-mono tracking-widest rounded-md"
                                  >
                                    SCAN
                                  </button>
                                </div>
                              )}

                              {/* Printer simulated print receipt trigger */}
                              {d.type === 'printer' && (
                                <button
                                  type="button"
                                  onClick={() => handleSimulatePrintReceipt()}
                                  className="border border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/10 text-white text-[9px] h-7 px-3.5 uppercase font-black font-mono tracking-widest rounded-md flex items-center gap-1"
                                >
                                  🖨️ Print Test
                                </button>
                              )}

                              {/* Card reader test transaction input */}
                              {d.type === 'card_reader' && (
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="text"
                                    placeholder="Amt"
                                    value={manualChargeAmount}
                                    onChange={(e) => setManualChargeAmount(e.target.value)}
                                    className="bg-black text-[#00ffcc] text-[10px] h-7 w-12 px-1 text-center border border-zinc-800 rounded font-mono font-bold"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleSimulatePayment}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-[9px] h-7 px-2 font-black uppercase font-mono rounded"
                                  >
                                    CHARGE
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Connection Toggles */}
                          {isConnected ? (
                            <button
                              type="button"
                              onClick={() => handleDisconnectDevice(d.id)}
                              className="px-2.5 py-1.5 border border-red-900/30 hover:bg-red-950/20 text-red-400 text-[9.5px] uppercase font-bold tracking-wider rounded-lg flex items-center gap-1 font-mono cursor-pointer"
                            >
                              <Power className="w-3 h-3 text-red-500" /> Disconnect
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isConnecting}
                                onClick={() => handleConnectDevice(d.id)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all font-mono cursor-pointer flex items-center gap-1 ${
                                  isConnecting 
                                    ? 'bg-zinc-800 text-zinc-500 cursor-wait border border-zinc-700' 
                                    : 'bg-[#1e293b] hover:bg-zinc-800 text-white border border-zinc-800'
                                }`}
                              >
                                Connect
                              </button>
                              
                              {/* Option to clear binding */}
                              {!['sk-s700', 'pr-sm230', 'cr-chipper'].includes(d.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSavedDevice(d.id)}
                                  className="text-zinc-650 hover:text-red-400 text-xs font-mono p-1"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: Diagnostic Logs */}
          {activeTab === 'diagnostics' && (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3 h-full flex flex-col pt-1"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[9px] text-[#00ffcc] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  📟 Bluetooth Serial Buffer Port Monitor
                </span>
                <button
                  type="button"
                  onClick={() => setHardwareLogs([])}
                  className="text-[9px] border border-zinc-800 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 px-2 py-0.5 rounded font-mono font-bold"
                >
                  CLEAR LOGS
                </button>
              </div>

              <div className="bg-black/85 border border-zinc-900 font-mono text-[10px] p-3 rounded-xl h-[330px] overflow-y-auto space-y-2 custom-scrollbar text-left text-zinc-350">
                {hardwareLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-700 font-mono uppercase text-[9px] tracking-widest text-center py-12">
                    -- SERIAL BUFFER STREAM IS EMPTY --
                  </div>
                ) : (
                  hardwareLogs.map((l, lIdx) => (
                    <div key={`${l.id}-${lIdx}`} className="border-b border-zinc-950/20 pb-1.5 flex items-start gap-1">
                      <span className="text-zinc-600 block shrink-0 font-sans">[{l.time}]</span>
                      <span className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase shrink-0 tracking-wider mr-1 font-mono ${
                        l.source === 'System' 
                          ? 'bg-zinc-900 text-zinc-400' 
                          : 'bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20'
                      }`}>
                        {l.source}
                      </span>
                      <span className={`font-mono text-[10.5px] leading-relaxed break-all ${
                        l.type === 'success' 
                          ? 'text-emerald-400 font-bold' 
                          : l.type === 'warn' 
                            ? 'text-amber-400 font-bold' 
                            : 'text-zinc-300'
                      }`}>
                        {l.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}


          {/* TAB 3: Print Output Mockup stubs */}
          {activeTab === 'prints' && (
            <motion.div
              key="prints"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[9px] text-purple-400 font-mono font-bold uppercase tracking-widest block">
                  🖨️ ESC/POS Virtual Printer Trays
                </span>
                <button 
                  onClick={() => setPrintedReceipts([])}
                  className="text-[9px] text-zinc-500 hover:text-white font-mono uppercase font-bold"
                >
                  Clear Trays
                </button>
              </div>

              {printedReceipts.length === 0 ? (
                <div className="border border-zinc-900/60 bg-black/20 p-8 rounded-xl text-center space-y-2 text-zinc-650 font-mono py-16">
                  <FileText className="w-8 h-8 mx-auto text-zinc-750 opacity-40" />
                  <p className="text-[10px] font-bold uppercase tracking-wide">No documents printed yet</p>
                  <p className="text-[9px] text-zinc-600 max-w-xs mx-auto font-sans leading-relaxed">
                    Once a Star SM-S230i or Epson printer is Connected inside the Hardware Center tab, you can print receipts here dynamically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {printedReceipts.map((rcpt, idx) => (
                    <motion.div 
                      key={`${rcpt.id}-${idx}`}
                      initial={{ scale: 0.95, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white border-2 border-dashed border-zinc-300 rounded-lg p-4 font-mono text-zinc-900 shadow-xl overflow-hidden relative"
                    >
                      {/* Paper cut jagged outline mock top */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-zinc-200"></div>
                      
                      {/* Receipt body */}
                      <div className="text-zinc-950 text-[10.5px] font-mono leading-relaxed space-y-0.5 text-center select-none" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                        {rcpt.content.map((ln, idx) => {
                          const isHeading = ln.includes('NEXUS CORE SYSTEM') || ln.includes('PASS');
                          return (
                            <div 
                              key={`bt-device-row-${idx}`} 
                              className={`break-words whitespace-pre-wrap ${
                                isHeading 
                                  ? 'font-black tracking-wider text-black text-[11px]' 
                                  : 'text-zinc-800'
                              }`}
                            >
                              {ln}
                            </div>
                          );
                        })}
                      </div>

                      {/* Print details signature footer */}
                      <div className="mt-4 pt-2.5 border-t border-zinc-205 border-dotted flex justify-between items-center text-[8.5px] font-bold text-zinc-500">
                        <span>PRINTED @ {rcpt.timestamp}</span>
                        <span className="text-[8px] bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded font-black font-mono">FEED GRIND</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bluetooth diagnostics & physical parameters bar */}
      <div className="bg-[#080b0f] border-t border-zinc-900 px-3.5 py-2.5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5 col-span-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold uppercase tracking-wider">GATE GATEWAY STATUS: ONLINE</span>
        </div>
        <div>
          <span>BLE BUFFER OVERFLOW RECOVERY CLAMP: PROTECTED</span>
        </div>
      </div>

    </div>
  );
}
