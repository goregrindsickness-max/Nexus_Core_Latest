import React from 'react';
import { Table, Truck, ArrowRight } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: string;
}

interface TeamActivity {
  id: string;
  user: string;
  time: string;
  text: string;
}

interface MetricsSplitCardProps {
  isCritical: boolean;
  totalTableStock: number;
  totalVanStock: number;
  setIsTransferModalOpen: (open: boolean) => void;
  teamCarouselIndex: number;
  setTeamCarouselIndex: (index: number) => void;
  setIsTeamCarouselPaused: (paused: boolean) => void;
  setActiveTab: (tab: string) => void;
  setSettingsExpandedSection: (section: string) => void;
  triggerNotification: (msg: string) => void;
  teamMembers: TeamMember[];
  teamActivities: TeamActivity[];
}

export default function MetricsSplitCard({
  isCritical,
  totalTableStock,
  totalVanStock,
  setIsTransferModalOpen,
  teamCarouselIndex,
  setTeamCarouselIndex,
  setIsTeamCarouselPaused,
  setActiveTab,
  setSettingsExpandedSection,
  triggerNotification,
  teamMembers,
  teamActivities
}: MetricsSplitCardProps) {
  return (
    <div className="px-5 py-2 grid grid-cols-2 gap-3">
      {/* Static metric display */}
      <div 
        className="bg-[#13161d] border rounded-xl p-3 flex flex-col justify-between h-[210px] hover:border-purple-500/50 transition-colors"
        style={{ borderWidth: '2.50957px', borderColor: '#7d0398' }}
      >
        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 mb-1">
          <span className="text-[9.5px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7d0398] animate-pulse"></span>
            LIVE INVENTORY
          </span>
        </div>
        
        <div className="flex-grow flex flex-col justify-around py-1.5">
          {/* Table Stock */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] items-start">
              <span className="text-zinc-400 font-sans flex items-center gap-1.5 font-medium">
                <Table className="w-3.5 h-3.5 text-purple-400" />
                Table Stock
              </span>
              <span className={`font-mono text-[11px] font-bold text-right flex flex-col items-end ${isCritical ? 'text-amber-400' : 'text-emerald-400'}`}>
                <span>{Math.round((totalTableStock / ((totalTableStock + totalVanStock) || 1)) * 100)}%</span>
                <span className="text-[8px] text-zinc-500 font-normal mt-0.5 leading-none">({totalTableStock} pcs)</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-zinc-950/80 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-amber-500' : 'bg-[#00ffcc]'}`}
                style={{ width: `${Math.round((totalTableStock / ((totalTableStock + totalVanStock) || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Van Stock */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] items-start">
              <span className="text-zinc-400 font-sans flex items-center gap-1.5 font-medium">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                Van Stock
              </span>
              <span className="font-mono text-[11px] text-zinc-300 font-bold text-right flex flex-col items-end">
                <span>{Math.round((totalVanStock / ((totalTableStock + totalVanStock) || 1)) * 100)}%</span>
                <span className="text-[8px] text-zinc-500 font-normal mt-0.5 leading-none">({totalVanStock} pcs)</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-zinc-950/80 rounded-full h-1 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((totalVanStock / ((totalTableStock + totalVanStock) || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Restock Button & Action */}
        <div className="pt-2 border-t border-zinc-900">
          <button 
            type="button"
            onClick={() => {
              setIsTransferModalOpen(true);
            }}
            className="w-full text-[8.5px] font-mono font-bold uppercase py-1.5 bg-[#170a24] hover:bg-[#25103c] border border-purple-900/30 hover:border-purple-500/50 rounded-lg text-purple-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-400' : 'bg-purple-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isCritical ? 'bg-red-500' : 'bg-purple-500'}`}></span>
            </span>
            <span>Tap to Restock (Transfer)</span>
            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform text-[#00ffcc]" />
          </button>
        </div>
      </div>

      {/* Dynamic Live Team & Team Activity Carousel Card */}
      <div 
        className="bg-[#13161d] border rounded-xl p-3 flex flex-col justify-between h-[210px] overflow-hidden"
        style={{ borderWidth: '3.1739100000000002px', borderColor: '#1e43b0' }}
        onMouseEnter={() => setIsTeamCarouselPaused(true)}
        onMouseLeave={() => setIsTeamCarouselPaused(false)}
      >
        {/* Header Switch Tabs */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setTeamCarouselIndex(0)}
              className={`text-[8.5px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer ${
                teamCarouselIndex === 0 ? 'text-[#00ffcc] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              LIVE TEAM
            </button>
            <button 
              type="button"
              onClick={() => setTeamCarouselIndex(1)}
              className={`text-[8.5px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer ${
                teamCarouselIndex === 1 ? 'text-[#00ffcc] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              ⚡ ACTIVITY
            </button>
          </div>

          {/* Quick Link block to Settings > Team Section */}
          {teamCarouselIndex === 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                setSettingsExpandedSection('team');
                triggerNotification('Navigating to Team Management panel in Settings');
              }}
              className="text-[8px] md:text-[9.5px] font-mono bg-violet-950/50 hover:bg-violet-900/60 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 px-2 py-0.5 rounded flex items-center gap-1 transition-all hover:text-white cursor-pointer"
              title="Add new member to the crew"
            >
              + Add Member
            </button>
          )}
        </div>

        {/* Subcontent depending on the active slide */}
        <div className="flex-grow flex items-center justify-center mt-2.5 overflow-hidden">
          {teamCarouselIndex === 0 ? (
            /* Slide 1: Vertical list of live team members & profiles */
            <div className="flex flex-col gap-1.5 w-full h-[125px] overflow-y-auto pr-0.5 scrollbar-barely-visible">
              {teamMembers.map((member, idx) => (
                <div key={`${member.id}-${idx}`} className="flex items-center gap-2 px-1.5 py-1 bg-zinc-950/20 hover:bg-zinc-950/50 rounded border border-zinc-900/10 transition-colors w-full group">
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 group-hover:border-[#00ffcc] transition-colors shadow">
                      <img 
                        src={member.avatar} 
                        alt={member?.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    {member.status === 'active' && (
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-[#13161d] animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-[10px] text-zinc-200 font-bold font-sans truncate leading-tight group-hover:text-[#00ffcc] transition-colors">
                      {member?.name}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider leading-none">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Inline action item at bottom of list */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setSettingsExpandedSection('team');
                  triggerNotification('Navigating to Team Management panel in Settings');
                }}
                className="mt-1 flex items-center justify-center gap-1 w-full py-2 border border-dashed border-zinc-800/80 hover:border-violet-500/50 hover:bg-violet-950/15 text-[8.5px] text-zinc-500 hover:text-violet-300 rounded transition-all font-mono cursor-pointer"
              >
                ➕ ADD NEW TEAM MEMBER
              </button>
            </div>
          ) : (
            /* Slide 2: Auto or scrollable List of dynamic actions */
            <div className="space-y-1.5 w-full h-[125px] overflow-y-auto pr-0.5 scrollbar-barely-visible">
              {teamActivities.map((act, idx) => (
                <div key={`${act.id}-${idx}`} className="text-[8.5px] bg-zinc-950/40 px-2 py-1.5 rounded border border-zinc-900/40 leading-snug">
                  <div className="flex justify-between items-center text-[7.5px] text-zinc-500 font-mono mb-0.5">
                    <span className="font-bold text-zinc-400">{act.user}</span>
                    <span>{act.time}</span>
                  </div>
                  <p className="text-zinc-350 font-sans text-[8.5px]">
                    {act.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer track dots */}
        <div className="flex justify-center gap-1.5 pt-2">
          <button 
            type="button"
            onClick={() => setTeamCarouselIndex(0)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              teamCarouselIndex === 0 ? 'w-4 bg-[#00ffcc]' : 'w-1.5 bg-zinc-700'
            }`}
          />
          <button 
            type="button"
            onClick={() => setTeamCarouselIndex(1)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              teamCarouselIndex === 1 ? 'w-4 bg-[#00ffcc]' : 'w-1.5 bg-zinc-700'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
