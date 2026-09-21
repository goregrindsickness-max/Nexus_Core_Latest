import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  Plus 
} from 'lucide-react';
import { Sale, InventoryItem } from '../../../types';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  date: string;
}

interface TopSellingItem {
  name: string;
  count: number;
  imageUrl: string;
}

interface FourCardAutoCarouselProps {
  leftCarouselIndex: number;
  setLeftCarouselIndex: React.Dispatch<React.SetStateAction<number>>;
  isLeftCardPaused: boolean;
  setIsLeftCardPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGlobalHoverPaused: (paused: boolean) => void;
  
  handleLeftTouchStart: (e: React.TouchEvent) => void;
  handleLeftTouchMove: (e: React.TouchEvent) => void;
  handleLeftTouchEnd: () => void;
  
  todayRevenue: number;
  dailySalesGoal: number;
  isEditingSalesGoal: boolean;
  setIsEditingSalesGoal: React.Dispatch<React.SetStateAction<boolean>>;
  salesGoalInput: string;
  setSalesGoalInput: React.Dispatch<React.SetStateAction<string>>;
  handleSaveSalesGoal: (amount: number) => void;
  totalSalesCount: number;
  
  expenses: ExpenseItem[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  handleAddExpense: (description: string, amount: number) => void;
  newExpenseDesc: string;
  setNewExpenseDesc: React.Dispatch<React.SetStateAction<string>>;
  newExpenseAmount: string;
  setNewExpenseAmount: React.Dispatch<React.SetStateAction<string>>;
  
  expensePerShow: number;
  dailyExpensesTotal: number;
  runningExpensesTotal: number;
  
  triggerNotification: (msg: string) => void;
  topSellingItems: TopSellingItem[];
  setActiveTab: (tab: string) => void;
}

export default function FourCardAutoCarousel({
  leftCarouselIndex,
  setLeftCarouselIndex,
  isLeftCardPaused,
  setIsLeftCardPaused,
  setIsGlobalHoverPaused = () => {},
  handleLeftTouchStart,
  handleLeftTouchMove,
  handleLeftTouchEnd,
  todayRevenue,
  dailySalesGoal,
  isEditingSalesGoal,
  setIsEditingSalesGoal,
  salesGoalInput,
  setSalesGoalInput,
  handleSaveSalesGoal,
  totalSalesCount,
  expenses,
  setExpenses,
  handleAddExpense,
  newExpenseDesc,
  setNewExpenseDesc,
  newExpenseAmount,
  setNewExpenseAmount,
  expensePerShow,
  dailyExpensesTotal,
  runningExpensesTotal,
  triggerNotification,
  topSellingItems,
  setActiveTab
}: FourCardAutoCarouselProps) {

  // Sound synthesis cue player
  const playMetricSound = (type: 'click' | 'success' | 'edit') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'edit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(554.37, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Silently catch browser audio restrictions
    }
  };

  // Dynamic gradient shadows or aura indicators behind the current card index
  const auraColors = [
    "rgba(16, 185, 129, 0.08)", // Emerald Green for Tonight total
    "rgba(244, 63, 94, 0.08)",   // Rose Pink/Red for Expenses ledger
    "rgba(245, 158, 11, 0.12)",  // Cyber Gold Aura for Daily Goal metric
    "rgba(0, 255, 204, 0.08)"    // Cyan/Turquoise Neon for Top Items ranking
  ];

  const currentAura = auraColors[leftCarouselIndex] || "rgba(245, 158, 11, 0.12)";

  // Progress encouragement tags reflecting current sales status
  const targetPercentage = Math.floor((todayRevenue / dailySalesGoal) * 100);
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

  return (
    <div className="px-5 py-2">
      <div 
        onMouseEnter={() => { setIsLeftCardPaused(true); setIsGlobalHoverPaused(true); }}
        onMouseLeave={() => { setIsLeftCardPaused(false); setIsGlobalHoverPaused(false); }}
        onTouchStart={handleLeftTouchStart}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        onFocus={() => { setIsLeftCardPaused(true); setIsGlobalHoverPaused(true); }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsLeftCardPaused(false);
            setIsGlobalHoverPaused(false);
          }
        }}
        style={{ 
          backgroundImage: `radial-gradient(circle at 50% 120%, ${currentAura}, transparent 65%), radial-gradient(circle at 10% 10%, rgba(255,255,255,0.02) 1px, transparent 0)` 
        }}
        className="bg-gradient-to-br from-[#0a0d14] via-[#090b0f] to-[#040508] border border-zinc-805/90 rounded-2xl p-4 flex flex-col justify-between h-[245px] sm:h-[240px] relative overflow-hidden w-full transition-all duration-700 ease-out shadow-[0_8px_30px_rgba(0,0,0,0.5)] select-none cursor-grab active:cursor-grabbing hover:border-zinc-700/80"
      >
        <div className="flex justify-between items-center mb-1.5 relative z-10 border-b border-zinc-900/40 pb-1.5">
          <div className="flex gap-4 items-center">
            <button
              type="button"
              onClick={() => { setLeftCarouselIndex(0); playMetricSound('click'); }}
              className="p-3 -m-2.5 focus:outline-none flex items-center justify-center cursor-pointer"
              title="Tonight's Revenue"
            >
              <span className={`block h-1.5 rounded-full transition-all ${leftCarouselIndex === 0 ? 'w-5 bg-emerald-400' : 'w-2 bg-zinc-800 hover:bg-zinc-700'}`} />
            </button>
            <button
              type="button"
              onClick={() => { setLeftCarouselIndex(1); playMetricSound('click'); }}
              className="p-3 -m-2.5 focus:outline-none flex items-center justify-center cursor-pointer"
              title="Tour Expenses"
            >
              <span className={`block h-1.5 rounded-full transition-all ${leftCarouselIndex === 1 ? 'w-5 bg-rose-500' : 'w-2 bg-zinc-800 hover:bg-zinc-700'}`} />
            </button>
            <button
              type="button"
              onClick={() => { setLeftCarouselIndex(2); playMetricSound('click'); }}
              className="p-3 -m-2.5 focus:outline-none flex items-center justify-center cursor-pointer"
              title="Daily Sales Goal"
            >
              <span className={`block h-1.5 rounded-full transition-all ${leftCarouselIndex === 2 ? 'w-5 bg-amber-400' : 'w-2 bg-zinc-800 hover:bg-zinc-700'}`} />
            </button>
            <button
              type="button"
              onClick={() => { setLeftCarouselIndex(3); playMetricSound('click'); }}
              className="p-3 -m-2.5 focus:outline-none flex items-center justify-center cursor-pointer"
              title="Top Selling Items"
            >
              <span className={`block h-1.5 rounded-full transition-all ${leftCarouselIndex === 3 ? 'w-5 bg-[#00ffcc]' : 'w-2 bg-zinc-800 hover:bg-zinc-700'}`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => { setLeftCarouselIndex(prev => prev === 0 ? 3 : prev - 1); playMetricSound('click'); }} className="p-2 sm:p-1.5 rounded-full border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer" title="Previous Slide">
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-350" />
              </button>
              <button type="button" onClick={() => { setLeftCarouselIndex(prev => (prev + 1) % 4); playMetricSound('click'); }} className="p-2 sm:p-1.5 rounded-full border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer" title="Next Slide">
                <ChevronRight className="w-3.5 h-3.5 text-zinc-350" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLeftCardPaused(prev => !prev);
                playMetricSound('click');
              }}
              className={`text-[8.5px] font-mono px-3 py-2 sm:px-2 sm:py-1 rounded border transition-all duration-200 uppercase font-black tracking-widest cursor-pointer ${
                isLeftCardPaused 
                  ? 'bg-rose-950/45 border-rose-550/40 text-rose-400 hover:text-white shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title="Tap to toggle live auto-rotation freeze"
            >
              {isLeftCardPaused ? '⏸️ PAUSED' : '🔄 AUTO'}
            </button>
          </div>
        </div>

        <div className="flex-1 relative w-full pt-1">
          <AnimatePresence mode="wait">
            {/* Card 1: TONIGHT'S REVENUE / TOTALS */}
            {leftCarouselIndex === 0 && (
              <motion.div key="card-rev" initial={{ opacity: 0, scale: 0.98, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: 10 }} transition={{ duration: 0.25, ease: "easeOut" }} className="absolute inset-0 flex flex-col w-full">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold tracking-wider">TOUR REVENUE TOTALS</span>
                  <span className="text-[8px] font-mono flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE GAUGES</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2.5 mt-0.5">
                  <div className="bg-gradient-to-b from-black/40 to-black/20 border border-emerald-500/15 rounded-xl p-2 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                    <div>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block leading-none">TONIGHT</span>
                      <span className="text-xl font-bold font-display text-white block mt-0.5">${todayRevenue.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-zinc-900/60">
                      <span className="text-[8px] text-emerald-400 font-mono">▼ 10% venue cut</span>
                      <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-black/40 to-black/20 border border-zinc-800/60 rounded-xl p-2 flex flex-col justify-between hover:border-[#00ffcc]/30 transition-colors">
                    <div>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block leading-none">RUNNING TOTAL</span>
                      <span className="text-xl font-bold font-display text-zinc-350 block mt-0.5">${(todayRevenue + 1079).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-zinc-900/60">
                      <span className="text-[8px] text-zinc-400 font-mono">{totalSalesCount + 34} txns total</span>
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Card 2: TOUR EXPENSES */}
            {leftCarouselIndex === 1 && (
              <motion.div key="card-exp" initial={{ opacity: 0, scale: 0.98, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: 10 }} transition={{ duration: 0.25, ease: "easeOut" }} className="absolute inset-0 flex flex-col w-full">
                <div className="flex justify-between items-center mb-1">
                  <div 
                    onClick={() => { setActiveTab('reports'); triggerNotification('Opening full Expenses Ledger...'); }}
                    className="flex items-center gap-1.5 cursor-pointer group"
                    title="Click to view detailed ledger"
                  >
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider group-hover:text-rose-300 transition-colors">TOUR EXPENSES</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActiveTab('reports'); triggerNotification('Opening full Expenses Ledger...'); }}
                      className="text-[8.5px] text-rose-400/80 hover:text-rose-350 font-mono flex items-center gap-0.5 transition-colors cursor-pointer bg-rose-500/10 px-1 rounded border border-rose-500/10"
                      title="Open Full Expenses Ledger"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Ledger</span>
                    </button>
                  </div>
                  <span 
                    onClick={() => { setActiveTab('reports'); triggerNotification('Opening full Expenses Ledger...'); }}
                    className="text-[8px] bg-rose-500/10 text-rose-450 px-1.5 py-0.5 rounded uppercase tracking-wider border border-rose-500/20 font-mono cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                  >
                    Show Total: ${expensePerShow.toFixed(2)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1 font-mono">
                  <div className="bg-[#12080a] border border-rose-950/40 rounded-lg p-1.5 hover:border-rose-500/35 hover:bg-[#1c0a0d] transition-all duration-350 group/tile text-left">
                     <span className="text-[7.5px] text-zinc-500 group-hover/tile:text-rose-400 transition-colors block leading-none">TODAY ➔</span>
                     <span className="text-xs text-rose-400 font-extrabold mt-1 block">${dailyExpensesTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="bg-[#12080a] border border-rose-950/40 rounded-lg p-1.5 text-right hover:border-rose-500/35 hover:bg-[#1c0a0d] transition-all duration-350 group/tile">
                     <span className="text-[7.5px] text-zinc-500 group-hover/tile:text-rose-400 transition-colors block leading-none">RUNNING TOTAL ➔</span>
                     <span className="text-xs text-rose-400 font-extrabold mt-1 block">${runningExpensesTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Dynamic Recent Expenses Mini-List */}
                <div className="my-1.5 overflow-y-auto max-h-[62px] pr-0.5 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {expenses.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-2">
                      <span className="text-[8.5px] font-mono text-zinc-600 uppercase tracking-widest">No expenses logged</span>
                    </div>
                  ) : (
                    expenses.slice(-4).reverse().map((e, eIdx) => (
                      <div 
                        key={`${e.id}-${eIdx}`}
                        className="flex justify-between items-center bg-[#100305]/60 hover:bg-[#190508]/80 border border-zinc-900/60 hover:border-rose-500/20 rounded-md px-2 py-1 font-mono text-[8.5px] transition-all"
                      >
                        <span className="text-zinc-350 truncate max-w-[130px]" title={e.description}>
                          {e.description}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-rose-450 font-bold">${(e.amount ?? 0).toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setExpenses(prev => {
                                const updated = prev.filter(item => item.id !== e.id);
                                localStorage.setItem('nexus_core_expenses', JSON.stringify(updated));
                                return updated;
                              });
                              triggerNotification(`Deleted item: ${e.description}`);
                            }}
                            className="text-zinc-655 hover:text-rose-405 p-0.5 transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="mt-auto bg-[#140b0d]/40 border border-rose-950/20 rounded-xl p-1 relative z-10 w-[98%] mx-auto">
                   <div className="flex gap-1 items-center justify-center pl-0.5 pr-0.5">
                     <input 
                       type="text" 
                       value={newExpenseDesc} 
                       onChange={e => setNewExpenseDesc(e.target.value)} 
                       placeholder="Expense item..." 
                       className="flex-1 bg-[#100305] border border-zinc-850 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/10 text-xs text-white rounded-lg px-2 h-7 outline-none font-mono placeholder:text-zinc-600 transition-all duration-200 min-w-0" 
                     />
                     <input 
                       type="number" 
                       value={newExpenseAmount} 
                       onChange={e => setNewExpenseAmount(e.target.value)} 
                       placeholder="$" 
                       className="w-12 bg-[#100305] border border-zinc-850 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/10 rounded-lg text-xs text-white outline-none px-1 h-7 font-mono text-center placeholder:text-zinc-650 transition-all duration-200" 
                     />
                     <button 
                       type="button"
                       onClick={() => { 
                         if (newExpenseDesc && newExpenseAmount) { 
                           handleAddExpense(newExpenseDesc, Number(newExpenseAmount)); 
                           playMetricSound('click'); 
                           setNewExpenseDesc(''); 
                           setNewExpenseAmount(''); 
                         } 
                       }} 
                       className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg px-2.5 font-bold text-[10px] uppercase h-7 transition-all duration-200 cursor-pointer shadow-md hover:shadow-rose-900/10 shrink-0 font-mono tracking-wider"
                     >
                       ADD
                     </button>
                   </div>
                </div>
              </motion.div>
            )}

            {/* Card 3: DAILY SALES GOAL */}
            {leftCarouselIndex === 2 && (
              <motion.div key="card-goal" initial={{ opacity: 0, scale: 0.98, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: 10 }} transition={{ duration: 0.25, ease: "easeOut" }} className="absolute inset-0 flex flex-col w-full pr-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono uppercase text-amber-400 block font-bold tracking-wider font-semibold">DAILY SALES GOAL</span>
                  <span className={`text-[8.5px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border ${motivationColor} transition-all duration-350`}>
                    {motivationText}
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center items-center w-full mt-1">
                  {isEditingSalesGoal ? (
                    <div className="flex flex-col items-center gap-1.5 w-full relative z-20">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-black text-amber-400">$</span>
                        <input 
                          type="number" 
                          value={salesGoalInput} 
                          onChange={e => setSalesGoalInput(e.target.value)}
                          className="w-20 bg-[#060401] border border-amber-500/50 rounded-lg p-1 text-base text-white text-center outline-none focus:border-amber-400 font-mono focus:ring-1 focus:ring-amber-450/40"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const finalGoalVal = Number(salesGoalInput) || 250;
                              handleSaveSalesGoal(finalGoalVal);
                              playMetricSound('success');
                              setIsEditingSalesGoal(false);
                            }
                          }}
                        />
                        <button 
                          onClick={() => { 
                            const finalGoalVal = Number(salesGoalInput) || 250;
                            handleSaveSalesGoal(finalGoalVal); 
                            playMetricSound('success');
                            setIsEditingSalesGoal(false); 
                          }} 
                          className="text-[8.5px] bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded hover:bg-amber-500/40 font-bold border border-amber-500/30 tracking-wider transition-all duration-205 cursor-pointer"
                        >
                          SET
                        </button>
                      </div>
                      {/* Quick Presets Pills */}
                      <div className="flex gap-1.5 mt-1">
                        {[150, 250, 500, 1000].map((preset, idx) => (
                          <button
                            key={`${preset}-${idx}`}
                            type="button"
                            onClick={() => {
                              setSalesGoalInput(String(preset));
                              playMetricSound('click');
                            }}
                            className="text-[8px] font-mono font-bold bg-zinc-900 border border-zinc-800 hover:bg-amber-950/40 hover:border-amber-500/30 text-zinc-400 hover:text-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            ${preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Display frame with interactive animated rotating borders
                    <div className="w-full flex flex-col items-center">
                      <div 
                        onClick={() => { 
                          setSalesGoalInput(String(dailySalesGoal)); 
                          setIsEditingSalesGoal(true); 
                          playMetricSound('edit');
                        }}
                        className="amber-chase-border cursor-pointer hover:scale-[1.03] transition-all duration-300 shadow-[0_4px_15px_rgba(245,158,11,0.18)] group"
                        title="Tap to change goal"
                      >
                        <div className="amber-chase-content px-4 py-1.5 flex items-center justify-center gap-2">
                          <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight select-none">
                            ${dailySalesGoal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <div className="p-0.5 rounded bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-all duration-200">
                            <Edit2 className="w-2.5 h-2.5 text-amber-400 opacity-85" />
                          </div>
                        </div>
                      </div>

                      {/* Direct Micro Incremental adjustment selectors */}
                      <div className="flex items-center gap-2 mt-1.5 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            const stepGoal = Math.max(50, dailySalesGoal - 50);
                            handleSaveSalesGoal(stepGoal);
                            playMetricSound('click');
                          }}
                          title="Decrease Goal"
                          className="px-2 py-0.5 text-[8.5px] font-mono leading-none bg-[#1d0d02] border border-amber-500/20 hover:border-amber-500/40 hover:bg-[#2c1303] text-amber-400 rounded cursor-pointer transition-all active:scale-95"
                        >
                          -50
                        </button>
                        <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest">Adjust</span>
                        <button
                          type="button"
                          onClick={() => {
                            const stepGoal = dailySalesGoal + 50;
                            handleSaveSalesGoal(stepGoal);
                            if (todayRevenue >= stepGoal) {
                              playMetricSound('success');
                            } else {
                              playMetricSound('click');
                            }
                          }}
                          title="Increase Goal"
                          className="px-2 py-0.5 text-[8.5px] font-mono leading-none bg-[#071f16] border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-[#0c3123] text-emerald-400 rounded cursor-pointer transition-all active:scale-95"
                        >
                          +50
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Glowing progress bar */}
                  <div className="w-full mt-2.5 h-2.5 rounded-full bg-black/50 border border-zinc-800/40 overflow-hidden relative">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min((todayRevenue / dailySalesGoal) * 100, 100)}%` }}
                       transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                       style={{
                         backgroundColor: targetPercentage >= 100 
                           ? '#10b981' // Green
                           : targetPercentage >= 75 
                             ? '#14b8a6' // Teal
                             : targetPercentage >= 40 
                               ? '#f59e0b' // Amber
                               : '#ef4444', // Red
                         boxShadow: targetPercentage >= 100 
                           ? '0 0 10px rgba(16, 185, 129, 0.7)' 
                           : targetPercentage >= 75 
                             ? '0 0 10px rgba(20, 184, 166, 0.6)' 
                             : '0 0 10px rgba(245, 158, 11, 0.6)'
                       }}
                       className="absolute inset-y-0 left-0 rounded-full" 
                     />
                  </div>
                  
                  <div className="w-full flex justify-between items-center mt-1 pt-0.5">
                    <span className="text-[8.5px] font-mono text-zinc-500 uppercase">
                      PROG: <span className="text-zinc-350 font-bold">${todayRevenue.toFixed(0)}</span>
                    </span>
                    <span className="text-[9.5px] font-mono text-amber-500 uppercase font-black tracking-wide font-semibold">
                      {targetPercentage}% achieved
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Card 4: TOP 3 LIST */}
            {leftCarouselIndex === 3 && (
              <motion.div key="card-top" initial={{ opacity: 0, scale: 0.98, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: 10 }} transition={{ duration: 0.25, ease: "easeOut" }} className="absolute inset-0 flex flex-col w-full pr-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#00ffcc] block font-bold tracking-wider">TOP SELLING ITEMS</span>
                  <span className="text-[7.5px] font-mono uppercase bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20 px-1 py-0.5 rounded leading-none font-bold">Ranks</span>
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5 justify-center w-full">
                  {topSellingItems.map((item, idx) => {
                    const medalBorder = idx === 0 
                      ? 'border-amber-400 bg-amber-500/10 text-amber-400 font-bold' 
                      : idx === 1 
                        ? 'border-zinc-300 bg-zinc-300/10 text-zinc-350 font-bold' 
                        : 'border-amber-700 bg-amber-800/10 text-amber-600 font-bold';
                    
                    const medalSymbol = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";

                    // Calculate relative selling percentages
                    const maxSellingCount = Math.max(1, ...topSellingItems.map(i => i.count));
                    const relativeWidthPercentage = Math.floor((item.count / maxSellingCount) * 100);

                    return (
                      <motion.div 
                        key={`carousel-card-${idx}`} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.3, delay: idx * 0.08, ease: "easeOut" }}
                        className="flex items-center gap-2 bg-black/45 px-2 py-1.5 rounded-xl border border-zinc-900/80 transition-all hover:bg-black/60 hover:-translate-y-0.5 duration-200"
                      >
                        <div className={`w-5 h-5 rounded-md border text-[10px] flex items-center justify-center font-mono ${medalBorder}`}>
                          {medalSymbol}
                        </div>
                        <img src={item.imageUrl} className="w-7 h-7 object-cover rounded shadow-sm border border-zinc-800 grayscale hover:grayscale-0 transition-all" alt="merch item" referrerPolicy="no-referrer" />
                        
                        <div className="flex-1 flex flex-col text-left justify-center min-w-0">
                          <div className="flex justify-between items-baseline leading-none mb-1">
                            <span className="text-[10px] font-sans text-zinc-200 font-bold truncate max-w-[130px]">{item?.name}</span>
                            <span className="text-[9.5px] font-mono text-[#00ffcc] font-black">{item.count} <span className="text-zinc-500 text-[8px] font-normal">sold</span></span>
                          </div>
                          
                          {/* Proportional visual bar */}
                          <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                            <div style={{ width: `${relativeWidthPercentage}%` }} className="bg-gradient-to-r from-teal-500 to-[#00ffcc] h-full rounded-full" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
