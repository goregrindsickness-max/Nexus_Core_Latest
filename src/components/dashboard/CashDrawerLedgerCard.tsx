import React from 'react';
import { Banknote, CreditCard, TrendingDown, DollarSign, X, Trash2 } from 'lucide-react';
import { V2ExpandableCard } from '../V2ExpandableCard';

export interface CashTransaction {
  id: string;
  type: 'starting_bank' | 'bank_drop' | 'payout' | 'expense' | 'cash_sale';
  amount: number;
  description: string;
  created_at: string;
}

interface CashDrawerLedgerCardProps {
  summary: {
    startingBank: number;
    cashSales: number;
    totalPayouts: number;
    totalExpenses: number;
    bankDrops: number;
    netCash: number;
  };
  cashTransactions: CashTransaction[];
  setCashTransactions: React.Dispatch<React.SetStateAction<CashTransaction[]>>;
  inlineCashDrawerActiveFilter: 'all' | 'starting_bank' | 'bank_drop' | 'payout' | 'expense' | 'cash_sale';
  setInlineCashDrawerActiveFilter: (val: 'all' | 'starting_bank' | 'bank_drop' | 'payout' | 'expense' | 'cash_sale') => void;
  inlineCashDrawerAddingType: 'starting_bank' | 'bank_drop' | 'payout' | 'expense' | 'cash_sale' | null;
  setInlineCashDrawerAddingType: (val: 'starting_bank' | 'bank_drop' | 'payout' | 'expense' | 'cash_sale' | null) => void;
  inlineCashDrawerAmount: string;
  setInlineCashDrawerAmount: (val: string) => void;
  inlineCashDrawerDescription: string;
  setInlineCashDrawerDescription: (val: string) => void;
  triggerNotification?: (msg: string) => void;
}

export const CashDrawerLedgerCard: React.FC<CashDrawerLedgerCardProps> = ({
  summary,
  cashTransactions,
  setCashTransactions,
  inlineCashDrawerActiveFilter,
  setInlineCashDrawerActiveFilter,
  inlineCashDrawerAddingType,
  setInlineCashDrawerAddingType,
  inlineCashDrawerAmount,
  setInlineCashDrawerAmount,
  inlineCashDrawerDescription,
  setInlineCashDrawerDescription,
  triggerNotification,
}) => {
  const filteredTx = cashTransactions
    .filter(t => inlineCashDrawerActiveFilter === 'all' || t.type === inlineCashDrawerActiveFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const inlineTabs: { value: typeof inlineCashDrawerActiveFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'starting_bank', label: 'Starting Banks' },
    { value: 'bank_drop', label: 'Bank Drops' },
    { value: 'payout', label: 'Payouts' },
    { value: 'expense', label: 'Expenses' },
    { value: 'cash_sale', label: 'Cash Sales' }
  ];

  const getInlineDefaultDescription = (type: string) => {
    switch (type) {
      case 'starting_bank': return 'Set Starting Bank';
      case 'bank_drop': return 'Bank Drop';
      case 'payout': return 'Payout';
      case 'expense': return 'Expense';
      case 'cash_sale': return 'Cash Sale';
      default: return '';
    }
  };

  return (
    <V2ExpandableCard title="Cash Drawer Ledger" defaultExpanded={false}>
      <div className="p-4 bg-black">
        <div className="bg-[#0b0d13] border border-zinc-800 rounded-2xl p-4 flex flex-col w-full space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold tracking-wider">CASH DRAWER LEDGER CONTROLS</span>
            <span className="text-[8px] font-mono flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE BALANCE
            </span>
          </div>

          {/* Main stats block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance & Actions */}
            <div className="flex flex-col justify-between bg-zinc-950/40 p-4 rounded-xl border border-zinc-900 text-left">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none">Net Cash on Hand</span>
                <span className={`text-3xl font-extrabold font-display tracking-tight block mt-2 ${summary.netCash < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${summary.netCash.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Quick Actions</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInlineCashDrawerAddingType('starting_bank')}
                    className="py-2 px-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 font-semibold text-[9.5px] uppercase tracking-wider font-mono rounded transition-all cursor-pointer text-center"
                  >
                    + Starting Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setInlineCashDrawerAddingType('bank_drop')}
                    className="py-2 px-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-blue-400 font-semibold text-[9.5px] uppercase tracking-wider font-mono rounded transition-all cursor-pointer text-center"
                  >
                    + Bank Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => setInlineCashDrawerAddingType('payout')}
                    className="py-2 px-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-400 font-semibold text-[9.5px] uppercase tracking-wider font-mono rounded transition-all cursor-pointer text-center"
                  >
                    + Record Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => setInlineCashDrawerAddingType('expense')}
                    className="py-2 px-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-400 font-semibold text-[9.5px] uppercase tracking-wider font-mono rounded transition-all cursor-pointer text-center"
                  >
                    + Record Expense
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Breakdown */}
            <div className="grid grid-cols-2 gap-2 font-mono text-left">
              <div className="bg-zinc-900/30 border border-zinc-850 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[7.5px] text-zinc-500 uppercase tracking-wider block">Starting Bank</span>
                <span className="text-xs text-white font-extrabold mt-1 block">${summary.startingBank}</span>
              </div>
              <div className="bg-emerald-950/10 border border-emerald-900/10 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[7.5px] text-emerald-500 uppercase tracking-wider block">Cash Sales</span>
                <span className="text-xs text-emerald-400 font-extrabold mt-1 block">+${summary.cashSales}</span>
              </div>
              <div className="bg-[#1e1026]/10 border border-purple-900/10 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[7.5px] text-purple-500 uppercase tracking-wider block">Payouts</span>
                <span className="text-xs text-purple-400 font-extrabold mt-1 block">-${summary.totalPayouts}</span>
              </div>
              <div className="bg-[#2a1111]/10 border border-red-900/10 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[7.5px] text-rose-500 uppercase tracking-wider block">Expenses</span>
                <span className="text-xs text-rose-400 font-extrabold mt-1 block">-${summary.totalExpenses}</span>
              </div>
              <div className="bg-[#0f1b2b]/10 border border-blue-900/10 p-2.5 rounded-lg col-span-2 flex justify-between items-center px-3 py-2">
                <span className="text-[7.5px] text-blue-500 uppercase tracking-wider">Bank Drops</span>
                <span className="text-xs text-blue-400 font-extrabold">${summary.bankDrops}</span>
              </div>
            </div>
          </div>

          {/* Inline transaction creation form */}
          {inlineCashDrawerAddingType && (
            <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-4 space-y-3 text-left">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-2">
                  {inlineCashDrawerAddingType === 'starting_bank' && <Banknote className="w-4 h-4 text-emerald-400" />}
                  {inlineCashDrawerAddingType === 'bank_drop' && <CreditCard className="w-4 h-4 text-blue-400" />}
                  {inlineCashDrawerAddingType === 'payout' && <TrendingDown className="w-4 h-4 text-purple-400" />}
                  {inlineCashDrawerAddingType === 'expense' && <TrendingDown className="w-4 h-4 text-rose-400" />}
                  Record {inlineCashDrawerAddingType.replace('_', ' ')}
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    setInlineCashDrawerAddingType(null);
                    setInlineCashDrawerAmount('');
                    setInlineCashDrawerDescription('');
                  }}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block">Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={inlineCashDrawerAmount} 
                    onChange={e => setInlineCashDrawerAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 text-white p-2 font-mono text-sm focus:outline-none focus:border-emerald-400 rounded mt-1"
                    placeholder="0.00" 
                    autoFocus
                  />
                </div>
                
                {(inlineCashDrawerAddingType === 'expense' || inlineCashDrawerAddingType === 'payout') && (
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block">Description</label>
                    <input 
                      type="text" 
                      value={inlineCashDrawerDescription} 
                      onChange={e => setInlineCashDrawerDescription(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 text-white p-2 text-xs focus:outline-none focus:border-emerald-400 rounded mt-1"
                      placeholder="e.g., Gas, Food, Guarantee"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setInlineCashDrawerAddingType(null);
                    setInlineCashDrawerAmount('');
                    setInlineCashDrawerDescription('');
                  }}
                  className="px-3 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!inlineCashDrawerAmount || isNaN(Number(inlineCashDrawerAmount)) || Number(inlineCashDrawerAmount) <= 0) {
                      triggerNotification?.('Please enter a valid amount');
                      return;
                    }
                    
                    if ((inlineCashDrawerAddingType === 'expense' || inlineCashDrawerAddingType === 'payout') && !inlineCashDrawerDescription.trim()) {
                      triggerNotification?.('Please enter a description');
                      return;
                    }

                    const newTx: CashTransaction = {
                      id: "ct_" + Math.random().toString(36).substring(2, 9),
                      type: inlineCashDrawerAddingType,
                      amount: Number(inlineCashDrawerAmount),
                      description: inlineCashDrawerDescription.trim() || getInlineDefaultDescription(inlineCashDrawerAddingType),
                      created_at: new Date().toISOString()
                    };

                    setCashTransactions(prev => {
                      const updated = [newTx, ...prev];
                      localStorage.setItem('nexus_core_cash_transactions', JSON.stringify(updated));
                      return updated;
                    });
                    
                    triggerNotification?.(`Saved ${inlineCashDrawerAddingType.replace('_', ' ')}: $${Number(inlineCashDrawerAmount).toFixed(2)}`);
                    setInlineCashDrawerAddingType(null);
                    setInlineCashDrawerAmount('');
                    setInlineCashDrawerDescription('');
                  }}
                  className="px-4 py-1.5 text-xs font-mono font-bold bg-[#00ffcc] hover:bg-[#00e6b8] text-black rounded transition-colors"
                >
                  SAVE RECORD
                </button>
              </div>
            </div>
          )}

          {/* List with Filter tabs */}
          <div className="border-t border-zinc-900 pt-4 flex flex-col space-y-3 text-left">
            <span className="text-[8.5px] font-mono uppercase text-zinc-400 block font-bold tracking-wider">LEDGER TRANSACTIONS LOG</span>
            
            {/* Tab Filters */}
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-zinc-950">
              {inlineTabs.map((tab, idx) => (
                <button
                  key={`${tab.value}-${idx}`}
                  type="button"
                  onClick={() => setInlineCashDrawerActiveFilter(tab.value)}
                  className={`px-2.5 py-1 text-[8.5px] font-mono rounded transition-all cursor-pointer ${
                    inlineCashDrawerActiveFilter === tab.value
                      ? 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20 font-bold'
                      : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Transactions list */}
            <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {filteredTx.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 font-mono text-[10px]">
                  No {inlineCashDrawerActiveFilter === 'all' ? '' : inlineCashDrawerActiveFilter.replace('_', ' ') + ' '}records found
                </div>
              ) : (
                filteredTx.map((t, tIdx) => {
                  const isPlus = t.type === 'starting_bank' || t.type === 'cash_sale';
                  return (
                    <div 
                      key={`${t.id}-${tIdx}`} 
                      className="bg-zinc-950/45 hover:bg-zinc-950/85 border border-zinc-900/70 hover:border-zinc-800 p-2.5 rounded-lg flex justify-between items-center group transition-all"
                    >
                      <div className="flex gap-2.5 items-center min-w-0">
                        {/* Indicator Icon */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          t.type === 'starting_bank' || t.type === 'cash_sale' ? 'bg-emerald-500/5 text-emerald-400' :
                          t.type === 'bank_drop' ? 'bg-blue-500/5 text-blue-400' :
                          t.type === 'payout' ? 'bg-purple-500/5 text-purple-400' :
                          'bg-rose-500/5 text-rose-400'
                        }`}>
                          {t.type === 'starting_bank' && <Banknote className="w-3.5 h-3.5" />}
                          {t.type === 'cash_sale' && <DollarSign className="w-3.5 h-3.5" />}
                          {t.type === 'bank_drop' && <CreditCard className="w-3.5 h-3.5" />}
                          {t.type === 'payout' && <TrendingDown className="w-3.5 h-3.5" />}
                          {t.type === 'expense' && <TrendingDown className="w-3.5 h-3.5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-zinc-200 text-[11px] truncate">{t.description || t.type.replace('_', ' ')}</div>
                          <div className="text-[8px] text-zinc-500 flex items-center gap-1.5 mt-0.5 min-w-0 font-mono uppercase">
                            <span className="truncate">{new Date(t.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 shrink-0" />
                            <span className="capitalize text-zinc-500 truncate">{t.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-black tracking-tight ${
                          isPlus ? 'text-emerald-400' :
                          t.type === 'bank_drop' ? 'text-blue-400' :
                          t.type === 'payout' ? 'text-purple-400' :
                          'text-rose-400'
                        }`}>
                          {isPlus ? '+' : '-'}${t.amount.toFixed(2)}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setCashTransactions(prev => {
                              const updated = prev.filter(item => item.id !== t.id);
                              localStorage.setItem('nexus_core_cash_transactions', JSON.stringify(updated));
                              return updated;
                            });
                            triggerNotification?.(`Deleted ${t.type.replace('_', ' ')} record: $${t.amount}`);
                          }}
                          className="text-zinc-600 hover:text-rose-400 p-1 rounded hover:bg-zinc-900 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </V2ExpandableCard>
  );
};
