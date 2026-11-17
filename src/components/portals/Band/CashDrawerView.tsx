import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, X, TrendingDown, TrendingUp, Plus, Minus, CreditCard, Banknote } from 'lucide-react';
import { CashTransaction } from '../../../types';

interface CashDrawerViewProps {
  onClose: () => void;
  transactions: CashTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<CashTransaction[]>>;
  triggerNotification: (msg: string) => void;
}

export default function CashDrawerView({ onClose, transactions, setTransactions, triggerNotification }: CashDrawerViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  
  // Modals for adding transactions
  const [addingType, setAddingType] = useState<CashTransaction['type'] | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Derived financial summary
  const summary = useMemo(() => {
    let startingBank = 0;
    let cashSales = 0;
    let totalPayouts = 0;
    let totalExpenses = 0;
    let bankDrops = 0;

    transactions.forEach(t => {
      switch (t.type) {
        case 'starting_bank': startingBank += t.amount; break;
        case 'cash_sale': cashSales += t.amount; break;
        case 'payout': totalPayouts += t.amount; break;
        case 'expense': totalExpenses += t.amount; break;
        case 'bank_drop': bankDrops += t.amount; break;
      }
    });

    const netCash = startingBank + cashSales - totalPayouts - totalExpenses - bankDrops;

    return { startingBank, cashSales, totalPayouts, totalExpenses, bankDrops, netCash };
  }, [transactions]);

  const handleSave = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      triggerNotification('Please enter a valid amount');
      return;
    }
    if (!addingType) return;
    
    // Type specific check, if needed
    if ((addingType === 'expense' || addingType === 'payout') && !description.trim()) {
      triggerNotification('Please enter a description');
      return;
    }

    const t: CashTransaction = {
      id: "ct_" + Math.random().toString(36).substring(2, 9),
      type: addingType,
      amount: Number(amount),
      description: description.trim() || getDefaultDescription(addingType),
      created_at: new Date().toISOString()
    };

    setTransactions(prev => [t, ...prev]);
    triggerNotification(`Saved ${addingType.replace('_', ' ')}`);
    setAddingType(null);
    setAmount('');
    setDescription('');
  };

  const getDefaultDescription = (type: CashTransaction['type']) => {
    switch (type) {
      case 'starting_bank': return 'Set Starting Bank';
      case 'bank_drop': return 'Bank Drop';
      case 'payout': return 'Payout';
      case 'expense': return 'Expense';
      case 'cash_sale': return 'Cash Sale';
      default: return '';
    }
  };

  const renderAddForm = () => {
    if (!addingType) return null;
    return (
      <div className="absolute inset-0 z-10 bg-[#0b0d13]/92 backdrop-blur-sm p-4 flex flex-col justify-center">
        <div className="bg-[#13161d] p-4 rounded-xl border border-[#252830] shadow-2xl relative">
          <button 
             onClick={() => { setAddingType(null); setAmount(''); setDescription(''); }}
             className="absolute top-2.5 right-2.5 p-1.5 bg-zinc-800 rounded-full hover:bg-zinc-700 transition"
          >
             <X className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          
          <h3 className="text-xs font-bold text-white mb-3 uppercase flex items-center gap-1.5 font-display">
             {addingType === 'starting_bank' && <Banknote className="w-4.5 h-4.5 text-emerald-400" />}
             {addingType === 'bank_drop' && <CreditCard className="w-4.5 h-4.5 text-blue-400" />}
             {addingType === 'payout' && <TrendingDown className="w-4.5 h-4.5 text-purple-400" />}
             {addingType === 'expense' && <TrendingDown className="w-4.5 h-4.5 text-red-400" />}
             Record {addingType.replace('_', ' ')}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-mono text-zinc-500 uppercase block">Amount ($)</label>
              <input 
                 type="number" step="0.01" 
                 value={amount} onChange={e => setAmount(e.target.value)}
                 className="w-full bg-zinc-900 border-b border-zinc-700 text-white p-2 font-mono text-base focus:outline-none focus:border-[#00ffcc] transition-colors rounded-t mt-0.5"
                 placeholder="0.00" autoFocus
              />
            </div>
            
            {(addingType === 'expense' || addingType === 'payout') && (
              <div>
                <label className="text-[9px] font-mono text-zinc-500 uppercase block">Description</label>
                <input 
                   type="text" 
                   value={description} onChange={e => setDescription(e.target.value)}
                   className="w-full bg-zinc-900 border-b border-zinc-700 text-white p-2 text-xs focus:outline-none focus:border-[#00ffcc] transition-colors rounded-t mt-0.5"
                   placeholder="e.g., Gas, Food, Guarantee"
                />
              </div>
            )}
            
            <button 
               onClick={handleSave} 
               className="w-full bg-[#00ffcc] text-black font-bold uppercase tracking-wider py-2.5 rounded-lg mt-3 hover:bg-[#00e6b8] transition-colors active:scale-95 text-xs font-mono"
            >
              SAVE RECORD
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#0b0d13] w-full max-w-[340px] rounded-[24px] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
      >
         {/* HEADER */}
         <div className="p-4 pb-2">
            <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                     <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                     <h2 className="text-base font-bold text-white tracking-tight">Cash Drawer</h2>
                     <p className="text-[10px] text-zinc-400 font-mono">Manage tour finances</p>
                  </div>
               </div>
               <button 
                 onClick={onClose} 
                 className="p-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700 transition-colors"
               >
                 <X className="w-3.5 h-3.5 text-zinc-400" />
               </button>
            </div>

            {/* NET CASH DISPLAY */}
            <div className="bg-[#131f18] border border-emerald-900/30 rounded-xl p-3.5 mb-3.5 shadow-inner">
               <div className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase mb-0.5">Net Cash on Hand</div>
               <div className={`text-2xl font-extrabold tracking-tighter ${summary.netCash < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  ${summary.netCash.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
               </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 gap-2 mb-1">
               <button onClick={() => setAddingType('starting_bank')} className="bg-[#0b241e] hover:bg-[#11352c] border border-emerald-900/40 text-emerald-300 py-2 px-1.5 rounded-lg text-[10.5px] font-mono font-bold transition-colors cursor-pointer text-center">
                  Set Starting Bank
               </button>
               <button onClick={() => setAddingType('bank_drop')} className="bg-[#0f1b2b] hover:bg-[#16273d] border border-blue-900/40 text-blue-300 py-2 px-1.5 rounded-lg text-[10.5px] font-mono font-bold transition-colors cursor-pointer text-center">
                  Bank Drop
               </button>
               <button onClick={() => setAddingType('payout')} className="bg-[#1e1026] hover:bg-[#2c1737] border border-purple-900/40 text-purple-300 py-2 px-1.5 rounded-lg text-[10.5px] font-mono font-bold transition-colors cursor-pointer text-center">
                  Record Payout
               </button>
               <button onClick={() => setAddingType('expense')} className="bg-[#2a1111] hover:bg-[#3d1818] border border-red-900/40 text-red-300 py-2 px-1.5 rounded-lg text-[10.5px] font-mono font-bold transition-colors cursor-pointer text-center">
                  Record Expense
               </button>
            </div>
         </div>

         {/* NAVIGATION TABS */}
         <div className="flex border-b border-zinc-800">
            <button 
               className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 font-mono ${activeTab === 'overview' ? 'border-[#00ffcc] text-[#00ffcc]' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
               onClick={() => setActiveTab('overview')}
            >
               Overview
            </button>
            <button 
               className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 font-mono ${activeTab === 'transactions' ? 'border-[#00ffcc] text-[#00ffcc]' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
               onClick={() => setActiveTab('transactions')}
            >
               Transactions
            </button>
         </div>

         {/* TAB CONTENT */}
         <div className="flex-1 overflow-y-auto p-4 scrollbar-barely-visible pb-6">
            {activeTab === 'overview' && (
               <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-tight">Cash Flow Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-0.5">Starting Bank</div>
                        <div className="text-sm font-bold text-white">${summary.startingBank}</div>
                     </div>
                     <div className="bg-[#0b241e]/30 border border-emerald-900/20 p-3 rounded-lg">
                        <div className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest mb-0.5">Cash Sales</div>
                        <div className="text-sm font-bold text-emerald-400">+${summary.cashSales}</div>
                     </div>
                     <div className="bg-[#1e1026]/30 border border-purple-900/20 p-3 rounded-lg">
                        <div className="text-[8px] font-mono text-purple-500 uppercase tracking-widest mb-0.5">Total Payouts</div>
                        <div className="text-sm font-bold text-purple-400">-${summary.totalPayouts}</div>
                     </div>
                     <div className="bg-[#2a1111]/30 border border-red-900/20 p-3 rounded-lg">
                        <div className="text-[8px] font-mono text-red-500 uppercase tracking-widest mb-0.5">Total Expenses</div>
                        <div className="text-sm font-bold text-red-400">-${summary.totalExpenses}</div>
                     </div>
                     <div className="bg-[#0f1b2b]/30 border border-blue-900/20 p-3 rounded-lg col-span-2">
                        <div className="text-[8px] font-mono text-blue-500 uppercase tracking-widest mb-0.5">Bank Drops</div>
                        <div className="text-sm font-bold text-blue-400">-${summary.bankDrops}</div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'transactions' && (
               <div className="space-y-2">
                  {transactions.length === 0 ? (
                     <div className="text-center py-8 text-zinc-500 font-mono text-xs">No transactions yet</div>
                  ) : (
                     transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((t, tIdx) => (
                        <div key={`${t.id}-${tIdx}`} className="bg-zinc-900/40 border border-zinc-800/40 p-2.5 rounded-lg flex justify-between items-center group hover:bg-zinc-800/40 transition">
                           <div className="flex gap-2.5 items-center min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                 t.type === 'starting_bank' || t.type === 'cash_sale' ? 'bg-emerald-500/10 text-emerald-400' :
                                 t.type === 'bank_drop' ? 'bg-blue-500/10 text-blue-400' :
                                 t.type === 'payout' ? 'bg-purple-500/10 text-purple-400' :
                                 'bg-red-500/10 text-red-400'
                              }`}>
                                 {t.type === 'starting_bank' || t.type === 'cash_sale' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              </div>
                              <div className="min-w-0">
                                 <div className="font-bold text-white text-xs truncate">{t.description || t.type.replace('_', ' ')}</div>
                                 <div className="text-[9px] text-zinc-500 flex items-center gap-1 mt-0.5 min-w-0">
                                    <span className="truncate">{new Date(t.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-800 shrink-0"></span>
                                    <span className="capitalize truncate">{t.type.replace('_', ' ')}</span>
                                 </div>
                              </div>
                           </div>
                           <div className={`font-black tracking-tight text-xs shrink-0 pl-1 ${
                               t.type === 'starting_bank' || t.type === 'cash_sale' ? 'text-emerald-400' : 
                               t.type === 'bank_drop' ? 'text-blue-400' : 
                               t.type === 'payout' ? 'text-purple-400' : 
                               'text-red-400'
                            }`}>
                              {t.type === 'starting_bank' || t.type === 'cash_sale' ? '+' : '-'}${t.amount}
                           </div>
                        </div>
                     ))
                  )}
               </div>
            )}
         </div>

         {/* Add Transaction Overlay */}
         <AnimatePresence>
            {addingType && renderAddForm()}
         </AnimatePresence>
      </motion.div>
    </div>
  );
}
