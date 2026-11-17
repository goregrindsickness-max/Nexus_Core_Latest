import React from 'react';
import { V2ExpandableCard } from '../../V2ExpandableCard';
import ReportsView from './ReportsView';

export default function FinanceWorkspace(props: any) {
  const {
    activeBand,
    addLog,
    dashboardV2ActiveNav,
    expenses,
    inventory,
    renderDecoupledFinanceCards,
    sales,
    setExpenses,
    setShows,
    shows,
    triggerNotification,
  } = props;

  return (
    <div className="flex flex-col gap-0 min-h-screen bg-black w-full">
      {/* 1. Large glowing title for Reports & Analytics (Moved to the very top!) */}
      <div className="px-5 py-6 bg-[#030303] border-b border-zinc-900/80 flex flex-col gap-1 select-none relative overflow-hidden text-center justify-center items-center w-full">
        {/* Decorative ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-28 bg-[#39ff14]/5 blur-[75px] rounded-full pointer-events-none" />
        
        <h2 
          className="text-xl md:text-3xl font-display font-black tracking-widest text-white uppercase select-text relative z-10"
          style={{
            textShadow: '0 0 15px rgba(57, 255, 20, 0.45), 0 0 30px rgba(0, 255, 204, 0.3)',
            letterSpacing: '0.12em',
          }}
        >
          📈 Tour Financials & Analytics
        </h2>
        <p className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest relative z-10">
          Real-time revenue metrics, profit tracking, and predictive performance data for the active run.
        </p>
      </div>

      {/* 2. First 3 cards always visible (Now without accordions and with nice neon borders!) */}
      <div className="shrink-0 w-full pb-10">
        {renderDecoupledFinanceCards && renderDecoupledFinanceCards(true, true)}
      </div>

      {/* 3. The ReportsView which displays all the sub-sections grouped in clusters */}
      <div className="bg-black pb-0 w-full">
        <ReportsView 
          sales={sales} 
          shows={shows} 
          setShows={setShows} 
          inventory={inventory} 
          expenses={expenses} 
          setExpenses={setExpenses} 
          onBack={() => {}} 
          triggerNotification={triggerNotification} 
          addLog={addLog} 
          bandName={activeBand?.name || 'Artist'} 
          isEmbeddedInline={true} 
        />
      </div>
    </div>
  );
}
