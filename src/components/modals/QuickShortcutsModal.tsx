import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Package, Calendar, FileText, Plane, CheckSquare } from 'lucide-react';

interface QuickShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  setEditingItem: (item: any) => void;
  setPendingOpenShowsForm: (val: boolean) => void;
  setModalType: (type: string) => void;
  setIsModalOpen: (open: boolean) => void;
  setPendingFlightIsAdding: (val: boolean) => void;
  triggerNotification: (msg: string) => void;
}

export const QuickShortcutsModal: React.FC<QuickShortcutsModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  setEditingItem,
  setPendingOpenShowsForm,
  setModalType,
  setIsModalOpen,
  setPendingFlightIsAdding,
  triggerNotification
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="quick-action-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            key="quick-action-body"
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0e1015] border border-zinc-800 rounded-3xl p-5 shadow-2xl shadow-[#00ffcc]/5 flex flex-col space-y-4 relative overflow-hidden"
          >
            {/* Top border ambient highlight line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ffcc]/40 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
              <div className="space-y-0.5">
                <h3 className="font-display font-black text-xs uppercase tracking-widest text-[#00ffcc]">
                  Quick Actions Panel
                </h3>
                <p className="text-[10px] uppercase font-mono text-zinc-500 leading-none">
                  Select a shortcut to instantiate records
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Add New Sale */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('new-sale');
                  onClose();
                  triggerNotification('Launching Live Sales register...');
                }}
                className="group flex gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 hover:border-[#00ffcc]/30 hover:bg-[#00ffcc]/5 text-left transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all shrink-0 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-sans font-bold text-xs text-zinc-200 group-hover:text-white transition-colors">
                    Add New Sale
                  </h5>
                  <p className="text-[9.5px] text-zinc-400 font-mono tracking-tight leading-none mt-0.5">
                    Log Live Sales
                  </p>
                </div>
              </button>

              {/* 2. Add New Merch Item */}
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setActiveTab('add-item');
                  onClose();
                  triggerNotification('Creating new custom merch SKU...');
                }}
                className="group flex gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 hover:border-[#00ffcc]/30 hover:bg-[#00ffcc]/5 text-left transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-all shrink-0 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-sans font-bold text-xs text-zinc-200 group-hover:text-white transition-colors">
                    Add Merch Item
                  </h5>
                  <p className="text-[9.5px] text-zinc-400 font-mono tracking-tight leading-none mt-0.5">
                    Register new SKU Cargo
                  </p>
                </div>
              </button>

              {/* 3. Add New Show */}
              <button
                type="button"
                onClick={() => {
                  setPendingOpenShowsForm(true);
                  setActiveTab('shows');
                  onClose();
                  triggerNotification('Opening Tour date scheduling workspace...');
                }}
                className="group flex gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 hover:border-[#00ffcc]/30 hover:bg-[#00ffcc]/5 text-left transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 transition-all shrink-0 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-sans font-bold text-xs text-zinc-200 group-hover:text-white transition-colors">
                    Add New Show
                  </h5>
                  <p className="text-[9.5px] text-zinc-400 font-mono tracking-tight leading-none mt-0.5">
                    Calendar Show Planner
                  </p>
                </div>
              </button>

              {/* 4. Add New Note */}
              <button
                type="button"
                onClick={() => {
                  setModalType('note');
                  setIsModalOpen(true);
                  onClose();
                }}
                className="group flex gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 hover:border-[#00ffcc]/30 hover:bg-[#00ffcc]/5 text-left transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-all shrink-0 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-sans font-bold text-xs text-zinc-200 group-hover:text-white transition-colors">
                    Add New Note
                  </h5>
                  <p className="text-[9.5px] text-zinc-400 font-mono tracking-tight leading-none mt-0.5">
                    Daily Directives Note
                  </p>
                </div>
              </button>

              {/* 5. Add New Flight */}
              <button
                type="button"
                onClick={() => {
                  setPendingFlightIsAdding(true);
                  setActiveTab('flights');
                  onClose();
                }}
                className="group flex gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 hover:border-[#00ffcc]/30 hover:bg-[#00ffcc]/5 text-left transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-all shrink-0 flex items-center justify-center">
                  <Plane className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-sans font-bold text-xs text-zinc-200 group-hover:text-white transition-colors">
                    Add New Flight
                  </h5>
                  <p className="text-[9.5px] text-zinc-400 font-mono tracking-tight leading-none mt-0.5">
                    Log crew travel leg
                  </p>
                </div>
              </button>

              {/* 6. Add New Checklist Item */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('checklist');
                  onClose();
                }}
                className="group flex gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 hover:border-[#00ffcc]/30 hover:bg-[#00ffcc]/5 text-left transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-teal-500/10 text-[#00ffcc] group-hover:bg-teal-500/20 transition-all shrink-0 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-sans font-bold text-xs text-zinc-200 group-hover:text-white transition-colors">
                    Add Checklist Task
                  </h5>
                  <p className="text-[9.5px] text-zinc-400 font-mono tracking-tight leading-none mt-0.5">
                    Road setups checklist
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickShortcutsModal;
