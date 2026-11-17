import React, { useState } from 'react';
import { TrendingUp, Sparkles, Trash2, Edit2 } from 'lucide-react';
import { V2ExpandableCard } from '../V2ExpandableCard';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  created_at?: string;
}

interface DecoupledFinanceCardsProps {
  todayRevenue: number;
  dailySalesGoal: number;
  totalSalesCount: number;
  expensePerShow: number;
  dailyExpensesTotal: number;
  runningExpensesTotal: number;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  handleAddExpense: (description: string, amount: number) => void;
  handleSaveSalesGoal: (amount: number) => void;
  topSellingItems?: Array<{ name: string; count: number; imageUrl: string }>;
  onlyFirstThree?: boolean;
  noAccordions?: boolean;
  triggerNotification?: (msg: string) => void;
}

export const DecoupledFinanceCards: React.FC<DecoupledFinanceCardsProps> = ({
  todayRevenue,
  dailySalesGoal,
  totalSalesCount,
  expensePerShow,
  dailyExpensesTotal,
  runningExpensesTotal,
  expenses,
  setExpenses,
  handleAddExpense,
  handleSaveSalesGoal,
  topSellingItems = [],
  onlyFirstThree = false,
  noAccordions = false,
  triggerNotification,
}) => {
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [isEditingSalesGoal, setIsEditingSalesGoal] = useState(false);
  const [salesGoalInput, setSalesGoalInput] = useState(String(dailySalesGoal));

  // Motivation calculations
  const targetPercentage = Math.floor((todayRevenue / (dailySalesGoal || 1)) * 100);
  let motivationText = "METRIC: LIVE CO";
  let motivationColor = "text-zinc-500 border-zinc-800 bg-zinc-950/25";
  if (targetPercentage >= 100) {
    motivationText = "👑 GOAL SMASHED!";
    motivationColor = "text-[#00ffcc] border-[#00ffcc]/30 bg-[#00ffcc]/10 animate-pulse";
  } else if (targetPercentage >= 75) {
    motivationText = "🔥 PEAK TARGETS";
    motivationColor = "text-amber-400 border-amber-500/30 bg-amber-950/20";
  } else if (targetPercentage >= 50) {
    motivationText = "⭐ ON SCHED";
    motivationColor = "text-yellow-500 border-yellow-500/20 bg-yellow-950/10";
  } else if (targetPercentage >= 25) {
    motivationText = "✨ SELLING SPEED";
    motivationColor = "text-orange-400 border-orange-400/20 bg-orange-950/10";
  }

  const renderCardWrapper = (
    title: string,
    theme: 'green' | 'rose' | 'amber',
    children: React.ReactNode
  ) => {
    if (noAccordions) {
      const themes = {
        green: {
          border: 'border-emerald-500/30 hover:border-emerald-400/50',
          shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:shadow-[0_0_20px_rgba(16,185,129,0.22)]',
          headerBg: 'bg-emerald-950/25 border-emerald-900/30 text-emerald-400',
        },
        rose: {
          border: 'border-rose-500/30 hover:border-rose-400/50',
          shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.12)] hover:shadow-[0_0_20px_rgba(244,63,94,0.22)]',
          headerBg: 'bg-rose-950/25 border-rose-900/30 text-rose-400',
        },
        amber: {
          border: 'border-amber-500/30 hover:border-amber-400/50',
          shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.12)] hover:shadow-[0_0_20px_rgba(245,158,11,0.22)]',
          headerBg: 'bg-amber-950/25 border-amber-900/30 text-amber-400',
        },
      };
      const t = themes[theme];
      return (
        <div className={`w-full h-full flex flex-col rounded-2xl border-2 ${t.border} bg-black/60 ${t.shadow} transition-all duration-300 overflow-hidden`}>
          <div className={`px-4 py-3 border-b-2 font-mono text-xs font-bold uppercase tracking-widest text-left ${t.headerBg}`}>
            {title}
          </div>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      );
    }
    return (
      <V2ExpandableCard title={title} defaultExpanded={true}>
        {children}
      </V2ExpandableCard>
    );
  };

  return (
    <div className={`flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 bg-black w-full items-stretch pb-4 ${noAccordions ? 'px-0 py-2' : 'p-4'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Section 1: Tonight's Revenue */}
      <div className="w-[85vw] sm:w-full shrink-0 snap-center sm:snap-align-none">
        {renderCardWrapper("Tonight's Revenue", "green", (
          <div className="bg-gradient-to-br from-[#0a0d14] via-[#090b0f] to-[#040508] border border-zinc-800/60 rounded-2xl p-4 flex flex-col w-full h-full justify-center">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold tracking-wider">TOUR REVENUE TOTALS</span>
              <span className="text-[8px] font-mono flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE GAUGES</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-gradient-to-b from-black/40 to-black/20 border border-emerald-500/15 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                <div>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block leading-none">TONIGHT</span>
                  <span className="text-xl font-bold font-display text-white block mt-1">${todayRevenue.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-900/60">
                  <span className="text-[8px] text-emerald-400 font-mono">▼ 10% venue cut</span>
                  <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                </div>
              </div>
              <div className="bg-gradient-to-b from-black/40 to-black/20 border border-zinc-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-[#00ffcc]/30 transition-colors">
                <div>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block leading-none">RUNNING TOTAL</span>
                  <span className="text-xl font-bold font-display text-zinc-350 block mt-1">${(todayRevenue + 1079).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-900/60">
                  <span className="text-[8px] text-zinc-400 font-mono">{totalSalesCount + 34} txns total</span>
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Live Expenses */}
      <div className="w-[85vw] sm:w-full shrink-0 snap-center sm:snap-align-none">
        {renderCardWrapper("Live Expenses", "rose", (
          <div className="bg-gradient-to-br from-[#0a0d14] via-[#090b0f] to-[#040508] border border-zinc-800/60 rounded-2xl p-4 flex flex-col w-full h-full justify-between">
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => triggerNotification?.('Opening full Expenses Ledger...')}>
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider group-hover:text-rose-300 transition-colors">TOUR EXPENSES</span>
              </div>
              <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider border border-rose-500/20 font-mono">
                Show Total: ${expensePerShow.toFixed(2)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-1 font-mono">
              <div className="bg-[#12080a] border border-rose-950/40 rounded-lg p-2 hover:border-rose-500/35 hover:bg-[#1c0a0d] transition-all duration-350 group/tile">
                 <span className="text-[7.5px] text-zinc-500 group-hover/tile:text-rose-400 transition-colors block leading-none">TODAY ➔</span>
                 <span className="text-xs text-rose-400 font-extrabold mt-1 block">${dailyExpensesTotal.toFixed(2)}</span>
              </div>
              
              <div className="bg-[#12080a] border border-rose-950/40 rounded-lg p-2 text-right hover:border-rose-500/35 hover:bg-[#1c0a0d] transition-all duration-350 group/tile">
                 <span className="text-[7.5px] text-zinc-500 group-hover/tile:text-rose-400 transition-colors block leading-none">RUNNING TOTAL ➔</span>
                 <span className="text-xs text-rose-400 font-extrabold mt-1 block">${runningExpensesTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Dynamic Recent Expenses Mini-List */}
            <div className="my-3 overflow-y-auto max-h-[100px] pr-0.5 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {expenses.length === 0 ? (
                <div className="h-full flex items-center justify-center py-4">
                  <span className="text-[8.5px] font-mono text-zinc-600 uppercase tracking-widest">No expenses logged</span>
                </div>
              ) : (
                expenses.slice(-4).reverse().map((e, eIdx) => (
                  <div 
                    key={`${e.id}-${eIdx}`}
                    className="flex justify-between items-center bg-[#100305]/60 hover:bg-[#190508]/80 border border-zinc-900/60 hover:border-rose-500/20 rounded-md px-2.5 py-1.5 font-mono text-[8.5px] transition-all"
                  >
                    <span className="text-zinc-350 truncate max-w-[150px]" title={e.description}>
                      {e.description}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-405 font-bold">${(e.amount ?? 0).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setExpenses(prev => {
                            const updated = prev.filter(item => item.id !== e.id);
                            localStorage.setItem('nexus_core_expenses', JSON.stringify(updated));
                            return updated;
                          });
                          triggerNotification?.(`Deleted item: ${e.description}`);
                        }}
                        className="text-zinc-650 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="bg-[#140b0d]/40 border border-rose-950/20 rounded-xl p-1.5 relative z-10 w-full mx-auto">
               <div className="flex gap-1.5 items-center justify-center">
                 <input 
                   type="text" 
                   value={newExpenseDesc} 
                   onChange={e => setNewExpenseDesc(e.target.value)} 
                   placeholder="Expense item..." 
                   className="flex-1 bg-[#100305] border border-zinc-800 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/10 text-xs text-white rounded-lg px-2 h-7 outline-none font-mono placeholder:text-zinc-600 transition-all duration-200 min-w-0" 
                 />
                 <input 
                   type="number" 
                   value={newExpenseAmount} 
                   onChange={e => setNewExpenseAmount(e.target.value)} 
                   placeholder="$" 
                   className="w-14 bg-[#100305] border border-zinc-800 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/10 rounded-lg text-xs text-white outline-none px-1 h-7 font-mono text-center placeholder:text-zinc-650 transition-all duration-200" 
                 />
                 <button 
                   type="button"
                   onClick={() => { 
                     if (newExpenseDesc && newExpenseAmount) { 
                       handleAddExpense(newExpenseDesc, Number(newExpenseAmount)); 
                       setNewExpenseDesc(''); 
                       setNewExpenseAmount(''); 
                     } 
                   }} 
                   className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg px-3 font-bold text-[10px] uppercase h-7 transition-all duration-200 cursor-pointer shadow-md hover:shadow-rose-900/10 shrink-0 font-mono tracking-wider"
                 >
                   ADD
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 3: Daily Sales Goal Tracker */}
      <div className="w-[85vw] sm:w-full shrink-0 snap-center sm:snap-align-none">
        {renderCardWrapper("Daily Sales Goal Tracker", "amber", (
          <div className="bg-gradient-to-br from-[#0a0d14] via-[#090b0f] to-[#040508] border border-zinc-800/60 rounded-2xl p-4 flex flex-col w-full h-full justify-between">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-mono uppercase text-amber-400 block font-bold tracking-wider">DAILY SALES GOAL</span>
              <span className={`text-[8.5px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border ${motivationColor} transition-all duration-350`}>
                {motivationText}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center w-full">
              {isEditingSalesGoal ? (
                <div className="flex flex-col items-center gap-1.5 w-full relative z-20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black text-amber-400">$</span>
                    <input 
                      type="number" 
                      value={salesGoalInput} 
                      onChange={e => setSalesGoalInput(e.target.value)}
                      className="w-24 bg-[#060401] border border-amber-500/50 rounded-lg p-1.5 text-base text-white text-center outline-none focus:border-amber-400 font-mono"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const finalGoalVal = Number(salesGoalInput) || 250;
                          handleSaveSalesGoal(finalGoalVal);
                          setIsEditingSalesGoal(false);
                        }
                      }}
                    />
                    <button 
                      onClick={() => { 
                        const finalGoalVal = Number(salesGoalInput) || 250;
                        handleSaveSalesGoal(finalGoalVal); 
                        setIsEditingSalesGoal(false); 
                      }} 
                      className="text-[8.5px] bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded hover:bg-amber-500/40 font-bold border border-amber-500/30 tracking-wider transition-all duration-205 cursor-pointer"
                    >
                      SET
                    </button>
                  </div>
                  {/* Quick Presets Pills */}
                  <div className="flex gap-2 mt-1.5">
                    {[150, 250, 500, 1000].map((preset, idx) => (
                      <button
                        key={`${preset}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSalesGoalInput(String(preset));
                        }}
                        className="text-[8px] font-mono font-bold bg-zinc-900 border border-zinc-800 hover:bg-amber-950/40 hover:border-amber-500/30 text-zinc-400 hover:text-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <div 
                    onClick={() => { 
                      setSalesGoalInput(String(dailySalesGoal)); 
                      setIsEditingSalesGoal(true); 
                    }}
                    className="amber-chase-border cursor-pointer hover:scale-[1.03] transition-all duration-300 shadow-[0_4px_15px_rgba(245,158,11,0.18)] group"
                    title="Tap to change goal"
                  >
                    <div className="amber-chase-content px-5 py-2 flex items-center justify-center gap-2">
                      <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight select-none">
                        ${dailySalesGoal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <div className="p-0.5 rounded bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-all duration-200">
                        <Edit2 className="w-2.5 h-2.5 text-amber-400 opacity-85" />
                      </div>
                    </div>
                  </div>

                  {/* Direct Micro Incremental adjustment selectors */}
                  <div className="flex items-center gap-2 mt-2 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        const stepGoal = Math.max(50, dailySalesGoal - 50);
                        handleSaveSalesGoal(stepGoal);
                      }}
                      className="px-2.5 py-1 text-[8.5px] font-mono leading-none bg-[#1d0d02] border border-amber-500/20 hover:border-amber-500/40 hover:bg-[#2c1303] text-amber-400 rounded cursor-pointer transition-all active:scale-95"
                    >
                      -50
                    </button>
                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest">Adjust</span>
                    <button
                      type="button"
                      onClick={() => {
                        const stepGoal = dailySalesGoal + 50;
                        handleSaveSalesGoal(stepGoal);
                      }}
                      className="px-2.5 py-1 text-[8.5px] font-mono leading-none bg-[#071f16] border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-[#0c3123] text-emerald-400 rounded cursor-pointer transition-all active:scale-95"
                    >
                      +50
                    </button>
                  </div>
                </div>
              )}
              
              {/* Glowing progress bar */}
              <div className="w-full mt-3 h-2.5 rounded-full bg-black/50 border border-zinc-800/40 overflow-hidden relative">
                 <div 
                   style={{
                     width: `${Math.min((todayRevenue / (dailySalesGoal || 1)) * 100, 100)}%`,
                     backgroundColor: targetPercentage >= 100 
                       ? '#10b981' 
                       : targetPercentage >= 75 
                         ? '#14b8a6' 
                         : targetPercentage >= 40 
                           ? '#f59e0b' 
                           : '#ef4444',
                     boxShadow: targetPercentage >= 100 
                       ? '0 0 10px rgba(16, 185, 129, 0.7)' 
                       : targetPercentage >= 75 
                         ? '0 0 10px rgba(20, 184, 166, 0.6)' 
                         : '0 0 10px rgba(245, 158, 11, 0.6)'
                   }}
                   className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" 
                 />
              </div>
              
              <div className="w-full flex justify-between items-center mt-1.5 pt-0.5">
                <span className="text-[8.5px] font-mono text-zinc-500 uppercase">
                  PROG: <span className="text-zinc-350 font-bold">${todayRevenue.toFixed(0)}</span>
                </span>
                <span className="text-[9.5px] font-mono text-amber-500 uppercase font-black tracking-wide font-semibold">
                  {targetPercentage}% achieved
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 4: Top Selling Merch & Media Rankings */}
      {!onlyFirstThree && topSellingItems.length > 0 && (
        <V2ExpandableCard title="Top Selling Merch & Media Rankings" defaultExpanded={true}>
          <div className="bg-gradient-to-br from-[#0a0d14] via-[#090b0f] to-[#040508] border border-zinc-800/60 rounded-2xl p-4 flex flex-col w-full">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-mono uppercase text-[#00ffcc] block font-bold tracking-wider">TOP SELLING ITEMS</span>
              <span className="text-[7.5px] font-mono uppercase bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20 px-1.5 py-0.5 rounded leading-none font-bold">Ranks</span>
            </div>
            
            <div className="flex flex-col gap-2 justify-center w-full">
              {topSellingItems.map((item, idx) => {
                const medalBorder = idx === 0 
                   ? 'border-amber-400 bg-amber-500/10 text-amber-400 font-bold' 
                   : idx === 1 
                     ? 'border-zinc-300 bg-zinc-300/10 text-zinc-350 font-bold' 
                     : 'border-amber-700 bg-amber-800/10 text-amber-600 font-bold';
                
                const medalSymbol = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";

                const maxSellingCount = Math.max(1, ...topSellingItems.map(i => i.count));
                const relativeWidthPercentage = Math.floor((item.count / maxSellingCount) * 100);

                return (
                  <div 
                    key={`top-item-${item.name || ''}-${idx}`} 
                    className="flex items-center gap-2.5 bg-black/45 px-3 py-2 rounded-xl border border-zinc-900/80 transition-all hover:bg-black/60 hover:-translate-y-0.5 duration-200"
                  >
                    <div className={`w-5 h-5 rounded-md border text-[10px] flex items-center justify-center font-mono ${medalBorder}`}>
                      {medalSymbol}
                    </div>
                    <img src={item.imageUrl} className="w-8 h-8 object-cover rounded shadow-sm border border-zinc-800 grayscale hover:grayscale-0 transition-all" alt="merch item" referrerPolicy="no-referrer" />
                    
                    <div className="flex-1 flex flex-col text-left justify-center min-w-0">
                      <div className="flex justify-between items-baseline leading-none mb-1">
                        <span className="text-[10.5px] font-sans text-zinc-200 font-bold truncate max-w-[150px]">{item?.name}</span>
                        <span className="text-[10px] font-mono text-[#00ffcc] font-black">{item.count} <span className="text-zinc-500 text-[8.5px] font-normal">sold</span></span>
                      </div>
                      
                      <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                        <div style={{ width: `${relativeWidthPercentage}%` }} className="bg-gradient-to-r from-teal-500 to-[#00ffcc] h-full rounded-full" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </V2ExpandableCard>
      )}
    </div>
  );
};
