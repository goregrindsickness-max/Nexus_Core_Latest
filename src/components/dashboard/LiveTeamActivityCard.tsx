import React from 'react';
import { Users } from 'lucide-react';
import { V2ExpandableCard } from '../V2ExpandableCard';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: string;
  avatar: string;
}

interface TeamActivity {
  id: string;
  user: string;
  time: string;
  text: string;
}

interface LiveTeamActivityCardProps {
  teamMembers: TeamMember[];
  teamActivities: TeamActivity[];
  setIsLiveTeamActivityOpen: (open: boolean) => void;
  triggerNotification?: (msg: string) => void;
}

export const LiveTeamActivityCard: React.FC<LiveTeamActivityCardProps> = ({
  teamMembers,
  teamActivities,
  setIsLiveTeamActivityOpen,
  triggerNotification,
}) => {
  return (
    <V2ExpandableCard title="Live Team/ Activity" defaultExpanded={false}>
      <div className="p-4 bg-black">
        <div 
          className="bg-[#13161d] border rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/30 transition-colors w-full"
          style={{ borderWidth: '2px', borderColor: '#1e43b0' }}
        >
          {/* Title area */}
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-3">
            <span className="text-[11px] font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              LIVE CREW & ACTIVITY TRACKER
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLiveTeamActivityOpen(true);
                triggerNotification?.('Launching Team Roster Workspace');
              }}
              className="text-[9.5px] font-mono bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 px-2.5 py-1 rounded flex items-center gap-1.5 transition-all hover:text-white cursor-pointer font-bold animate-pulse"
            >
              ⚡ Launch Full Roster Hub
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Live Team */}
            <div className="space-y-2 bg-zinc-950/30 p-3 rounded-xl border border-zinc-900 flex flex-col h-[200px]">
              <span className="text-[8.5px] font-mono font-bold text-zinc-400 uppercase tracking-widest text-left">
                Active Crew ({teamMembers.length})
              </span>
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                {teamMembers.map((member, idx) => (
                  <div key={`${member.id}-${idx}`} className="flex items-center justify-between px-2 py-1.5 bg-zinc-900/40 hover:bg-zinc-900/80 rounded border border-zinc-850/60 transition-colors w-full group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 group-hover:border-[#00ffcc] transition-colors shadow">
                          <img 
                            src={member.avatar} 
                            alt={member?.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        {member.status === 'active' && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-[#13161d] animate-pulse" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="text-[10.5px] text-zinc-250 font-bold font-sans truncate leading-tight group-hover:text-[#00ffcc] transition-colors">
                          {member?.name}
                        </span>
                        <span className="text-[8px] text-zinc-550 font-mono uppercase tracking-wider leading-none">
                          {member.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-[8.5px] font-mono text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold">
                      {member.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Recent Activity Feed */}
            <div className="space-y-2 bg-zinc-950/30 p-3 rounded-xl border border-zinc-900 flex flex-col h-[200px]">
              <span className="text-[8.5px] font-mono font-bold text-zinc-400 uppercase tracking-widest text-left">Crew Actions Feed</span>
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                {teamActivities.map((act, idx) => (
                  <div key={`${act.id}-${idx}`} className="text-[8.5px] bg-zinc-900/35 px-2.5 py-2 rounded border border-zinc-850/40 leading-snug">
                    <div className="flex justify-between items-center text-[7.5px] text-zinc-550 font-mono mb-0.5">
                      <span className="font-bold text-zinc-300">{act.user}</span>
                      <span>{act.time}</span>
                    </div>
                    <p className="text-zinc-400 font-sans text-[8.5px]">
                      {act.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Full Workspace trigger button */}
          <button
            type="button"
            onClick={() => {
              setIsLiveTeamActivityOpen(true);
              triggerNotification?.('Launching Team Roster Workspace');
            }}
            className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 border border-indigo-500/35 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Users className="w-4 h-4 text-zinc-100 animate-bounce" />
            🚀 Open Full-Width Team Roster Console &amp; Gateway Sandbox
          </button>
        </div>
      </div>
    </V2ExpandableCard>
  );
};
