import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface OnboardBandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newBandName: string;
  setNewBandName: (val: string) => void;
  newBandHandle: string;
  setNewBandHandle: (val: string) => void;
  newBandStatus: string;
  setNewBandStatus: (val: any) => void;
  newBandSplit: number;
  setNewBandSplit: (val: number) => void;
  newBandInventory: number;
  setNewBandInventory: (val: number) => void;
  newBandActiveLp: string;
  setNewBandActiveLp: (val: string) => void;
}

export const LabelOnboardBandModal: React.FC<OnboardBandModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newBandName,
  setNewBandName,
  newBandHandle,
  setNewBandHandle,
  newBandStatus,
  setNewBandStatus,
  newBandSplit,
  setNewBandSplit,
  newBandInventory,
  setNewBandInventory,
  newBandActiveLp,
  setNewBandActiveLp
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0e1015] border border-zinc-850 rounded-3xl p-6 w-full max-w-md relative shadow-2xl overflow-hidden text-white"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black tracking-widest text-[#FF9900] uppercase mb-4">
              // ONBOARD NEW BAND CONTRACT
            </h3>

            <form onSubmit={onSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 uppercase mb-1">Band Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IMMOLATION"
                  value={newBandName}
                  onChange={e => setNewBandName(e.target.value)}
                  className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Handle (URL Slug)</label>
                <input
                  type="text"
                  placeholder="e.g. morbidangel"
                  value={newBandHandle}
                  onChange={e => setNewBandHandle(e.target.value)}
                  className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Initial Status</label>
                  <select
                    value={newBandStatus}
                    onChange={e => setNewBandStatus(e.target.value)}
                    className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                  >
                    <option value="OFF-CYCLE">OFF-CYCLE</option>
                    <option value="STUDIO">STUDIO</option>
                    <option value="TOURING">TOURING</option>
                    <option value="SHOW">SHOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Physical Split (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newBandSplit}
                    onChange={e => setNewBandSplit(Number(e.target.value))}
                    className="w-full bg-[#05080c] border border-[#ff8900]/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Initial Van Stock (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newBandInventory}
                    onChange={e => setNewBandInventory(Number(e.target.value))}
                    className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Active Catalog Item ID</label>
                  <input
                    type="text"
                    placeholder="e.g. NX-085"
                    value={newBandActiveLp}
                    onChange={e => setNewBandActiveLp(e.target.value)}
                    className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-[#FF9900] hover:bg-[#ffaa22] text-black font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
              >
                ONBOARD CONTRACT PROTOCOL
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface PingBandModalProps {
  activePingBand: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  pingMessage: string;
  setPingMessage: (val: string) => void;
}

export const LabelPingBandModal: React.FC<PingBandModalProps> = ({
  activePingBand,
  onClose,
  onSubmit,
  pingMessage,
  setPingMessage
}) => {
  return (
    <AnimatePresence>
      {activePingBand && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0e1015] border border-zinc-850 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl text-white"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black tracking-widest text-[#FF9900] uppercase mb-4">
              // PING BAND: {activePingBand.name}
            </h3>

            <form onSubmit={onSubmit} className="space-y-4 font-mono text-xs">
              <p className="text-zinc-400 leading-relaxed">
                Broadcast an encrypted notification and operational command to the band's mobile portal.
              </p>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Message Directive</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Load-in delayed by 45 minutes. Guard the physical road stock."
                  value={pingMessage}
                  onChange={e => setPingMessage(e.target.value)}
                  className="w-full bg-[#05080c] border border-zinc-850 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FF9900] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#FF9900] hover:bg-[#ffaa22] text-black font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
              >
                BROADCAST SIGNAL
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ShipRoadStockModalProps {
  activeShipRoadStockBand: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  shipRoadStockType: string;
  setShipRoadStockType: (val: string) => void;
  shipRoadStockQty: number;
  setShipRoadStockQty: (val: number) => void;
}

export const LabelShipRoadStockModal: React.FC<ShipRoadStockModalProps> = ({
  activeShipRoadStockBand,
  onClose,
  onSubmit,
  shipRoadStockType,
  setShipRoadStockType,
  shipRoadStockQty,
  setShipRoadStockQty
}) => {
  return (
    <AnimatePresence>
      {activeShipRoadStockBand && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0e1015] border border-zinc-850 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl text-white"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black tracking-widest text-[#00ffcc] uppercase mb-4">
              // EXPEDITE ROAD STOCK
            </h3>

            <form onSubmit={onSubmit} className="space-y-4 font-mono text-xs">
              <p className="text-zinc-400 leading-relaxed">
                Ship physical catalog items to <strong className="text-white">{activeShipRoadStockBand.name}</strong>'s touring transit vehicle.
              </p>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Format Type</label>
                <select
                  value={shipRoadStockType}
                  onChange={e => setShipRoadStockType(e.target.value)}
                  className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00ffcc]"
                >
                  <option value="vinyl">VINYL LP</option>
                  <option value="cd">DIGIPAK CD</option>
                  <option value="cassette">LIMITED CASSETTE</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Shipment Quantity (Units)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="250"
                  value={shipRoadStockQty}
                  onChange={e => setShipRoadStockQty(Number(e.target.value))}
                  className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00ffcc]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#00ffcc] hover:bg-[#12e0b5] text-black font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
              >
                DISPATCH ROAD EXPEDITION
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ReAuditSplitModalProps {
  activeReAuditBand: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newPhysicalSplit: number;
  setNewPhysicalSplit: (val: number) => void;
  newDigitalSplit: number;
  setNewDigitalSplit: (val: number) => void;
}

export const LabelReAuditSplitModal: React.FC<ReAuditSplitModalProps> = ({
  activeReAuditBand,
  onClose,
  onSubmit,
  newPhysicalSplit,
  setNewPhysicalSplit,
  newDigitalSplit,
  setNewDigitalSplit
}) => {
  return (
    <AnimatePresence>
      {activeReAuditBand && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0e1015] border border-zinc-850 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl text-white"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black tracking-widest text-[#a855f7] uppercase mb-4">
              // RE-AUDIT SPLIT PERCENT
            </h3>

            <form onSubmit={onSubmit} className="space-y-4 font-mono text-xs">
              <p className="text-zinc-400 leading-relaxed">
                Calibrate contract revenue sharing parameters for <strong className="text-white">{activeReAuditBand.name}</strong>.
              </p>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Physical Split Percentage (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newPhysicalSplit}
                    onChange={e => setNewPhysicalSplit(Number(e.target.value))}
                    className="flex-1 accent-[#a855f7]"
                  />
                  <span className="text-white font-bold w-12 text-right">{newPhysicalSplit}%</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Artist Split: {newPhysicalSplit}%. Label Split: {100 - newPhysicalSplit}%.</div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Digital Split Percentage (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newDigitalSplit}
                    onChange={e => setNewDigitalSplit(Number(e.target.value))}
                    className="flex-1 accent-[#a855f7]"
                  />
                  <span className="text-white font-bold w-12 text-right">{newDigitalSplit}%</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Artist Split: {newDigitalSplit}%. Label Split: {100 - newDigitalSplit}%. (Direct-To-Fan)</div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#a855f7] hover:bg-[#9333ea] text-white font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
              >
                CALIBRATE CONTRACT MATRIX
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface WarehouseRestockModalProps {
  activeRestockBand: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedRestockItemId: string;
  setSelectedRestockItemId: (val: string) => void;
  selectedRestockFormat: string;
  setSelectedRestockFormat: (val: string) => void;
  restockQty: number;
  setRestockQty: (val: number) => void;
  catalogReleases: any;
  catalogApparel: any;
}

export const LabelWarehouseRestockModal: React.FC<WarehouseRestockModalProps> = ({
  activeRestockBand,
  onClose,
  onSubmit,
  selectedRestockItemId,
  setSelectedRestockItemId,
  selectedRestockFormat,
  setSelectedRestockFormat,
  restockQty,
  setRestockQty,
  catalogReleases,
  catalogApparel
}) => {
  return (
    <AnimatePresence>
      {activeRestockBand && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0e1015] border border-zinc-850 rounded-3xl p-6 w-full max-w-md relative shadow-2xl text-white"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black tracking-widest text-[#FF9900] uppercase mb-4">
              // SHIP WAREHOUSE RESTOCK
            </h3>

            <form onSubmit={onSubmit} className="space-y-4 font-mono text-xs">
              <p className="text-zinc-400 leading-relaxed">
                Transfer central record label warehouse stock directly to <strong className="text-white">{activeRestockBand.name}</strong>'s touring van.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Select Catalog Item</label>
                  <select
                    value={selectedRestockItemId}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedRestockItemId(val);
                      const isApparel = (catalogApparel[activeRestockBand.id] || []).some((a: any) => a.id === val);
                      if (isApparel) {
                        setSelectedRestockFormat('apparel');
                      } else {
                        setSelectedRestockFormat('vinyl');
                      }
                    }}
                    className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                  >
                    <optgroup label="RELEASES">
                      {(catalogReleases[activeRestockBand.id] || []).map((r: any, rIdx) => (
                        <option key={`${r.id}-${rIdx}`} value={r.id}>{r.title} ({r.catalogId})</option>
                      ))}
                    </optgroup>
                    <optgroup label="APPAREL">
                      {(catalogApparel[activeRestockBand.id] || []).map((a: any, aIdx) => (
                        <option key={`${a.id}-${aIdx}`} value={a.id}>{a.title}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {selectedRestockFormat !== 'apparel' && (
                  <div>
                    <label className="block text-zinc-400 uppercase mb-1">Format</label>
                    <select
                      value={selectedRestockFormat}
                      onChange={e => setSelectedRestockFormat(e.target.value)}
                      className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                    >
                      <option value="vinyl">VINYL LP</option>
                      <option value="cd">DIGIPAK CD</option>
                      <option value="cassette">CASSETTE</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Display Current Warehouse Quantity */}
              <div className="bg-[#05080c] p-3 rounded-lg border border-zinc-850">
                <span className="text-zinc-500 uppercase">Available Label Warehouse Quantity: </span>
                <span className="text-[#00ffcc] font-black">
                  {(() => {
                    if (selectedRestockFormat === 'apparel') {
                      const item = (catalogApparel[activeRestockBand.id] || []).find((a: any) => a.id === selectedRestockItemId);
                      return item ? `${item.warehouse_qty || 0} units` : '0 units';
                    } else {
                      const item = (catalogReleases[activeRestockBand.id] || []).find((r: any) => r.id === selectedRestockItemId);
                      const fmt = selectedRestockFormat as 'vinyl' | 'cd' | 'cassette';
                      const safeFormats = item?.formats || { vinyl: { warehouse_qty: 0 }, cd: { warehouse_qty: 0 }, cassette: { warehouse_qty: 0 } };
                      return item ? `${safeFormats[fmt]?.warehouse_qty || 0} units` : '0 units';
                    }
                  })()}
                </span>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Restock Quantity (Units)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="200"
                  value={restockQty}
                  onChange={e => setRestockQty(Number(e.target.value))}
                  className="w-full bg-[#05080c] border border-zinc-850 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF9900]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#FF9900] hover:bg-[#ffaa22] text-black font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
              >
                EXECUTE WAREHOUSE TRANSFER
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
