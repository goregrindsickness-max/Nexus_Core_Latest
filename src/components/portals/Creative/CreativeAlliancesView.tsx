import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { getSupabase } from '../../../supabase';
import { X, Send, Plus, MessageSquare } from 'lucide-react';

interface CreativeAlliancesViewProps {
  userProfile: UserProfile;
  triggerNotification: (msg: string) => void;
  addLog?: (msg: string) => void;
}

const DEFAULT_ALLIANCES = [
  {
    id: "alliance-se-001",
    project_name: "CYBER-DOOM WORLD TOUR merch lineup",
    band_id: "band-savage-beast",
    total_budget: 1200,
    primary_creative_id: "creative-lead-soren",
    partner_creative_id: "creative-typ-drusilla",
    partner_name: "drusilla_vane",
    partner_role: "Pre-Press Layout Tech",
    primary_payout_percentage: 60.00,
    partner_payout_percentage: 40.00,
    alliance_status: "ACTIVE",
    contract_specs: {}
  },
  {
    id: "alliance-se-002",
    project_name: "GOTH-CORE DEVIANT LP Gatefold Layout",
    band_id: "band-mourning-star",
    total_budget: 1850,
    primary_creative_id: "creative-lead-soren",
    partner_creative_id: "creative-vec-vlad",
    partner_name: "vladislav_gore",
    partner_role: "Vector Separator",
    primary_payout_percentage: 75.00,
    partner_payout_percentage: 25.00,
    alliance_status: "PROPOSED",
    contract_specs: {}
  }
];

export default function CreativeAlliancesView({
  userProfile,
  triggerNotification,
  addLog
}: CreativeAlliancesViewProps) {
  const [alliances, setAlliances] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_creative_alliances');
      return saved ? JSON.parse(saved) : DEFAULT_ALLIANCES;
    } catch (_) {
      return DEFAULT_ALLIANCES;
    }
  });

  const [newProjName, setNewProjName] = useState('');
  const [newPrimarySplit, setNewPrimarySplit] = useState<number | ''>(60);
  const [partners, setPartners] = useState([{ name: '', role: '', split: 40 }]);

  const [selectedAlliance, setSelectedAlliance] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('nexus_core_creative_alliances', JSON.stringify(alliances));
  }, [alliances]);

  useEffect(() => {
    const fetchSupabaseAlliances = async () => {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data, error } = await supabase
            .from('creative_alliances')
            .select('*')
            .order('id', { ascending: false });

          if (!error && data && data.length > 0) {
            const mapped = data.map((item: any) => ({
              id: item.id,
              project_name: item.project_name,
              band_id: item.band_id,
              total_budget: Number(item.total_budget || 0),
              primary_creative_id: item.primary_creative_id,
              partner_creative_id: item.partner_creative_id,
              partner_name: item.partner_creative_id ? item.partner_creative_id.slice(0, 5) : "Pending",
              partner_role: item.contract_specs?.partner_role || "Co-Producer",
              partners: item.contract_specs?.partners || [{
                name: item.partner_creative_id ? item.partner_creative_id.slice(0, 5) : "Pending",
                role: item.contract_specs?.partner_role || "Co-Producer",
                split: Number(item.partner_payout_percentage)
              }],
              messages: item.contract_specs?.messages || [],
              primary_payout_percentage: Number(item.primary_payout_percentage),
              partner_payout_percentage: Number(item.partner_payout_percentage),
              alliance_status: item.alliance_status,
              contract_specs: item.contract_specs || {}
            }));
            
            setAlliances(prev => {
              const merged = [...prev];
              mapped.forEach((sbItem: any) => {
                if (!(merged || []).some(l => l.id === sbItem.id)) {
                  merged.unshift(sbItem);
                }
              });
              return merged;
            });
          }
        }
      } catch (_) {}
    };

    fetchSupabaseAlliances();
  }, []);

  const totalPartnerSplit = partners.reduce((sum, p) => sum + (Number(p.split) || 0), 0);
  const isFormValid = typeof newPrimarySplit === 'number' && (newPrimarySplit + totalPartnerSplit === 100) && newProjName.trim() && partners.every(p => p.name.trim() && p.role.trim());

  const handleCreateAlliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      triggerNotification("⚠️ Splits must equal 100 and all fields must be filled.");
      return;
    }

    const allianceId = `alliance-${Date.now()}`;
    const newAllianceItem = {
      id: allianceId,
      project_name: newProjName.trim(),
      band_id: "band-custom-release",
      total_budget: 0,
      primary_creative_id: userProfile?.id || "creative-lead-soren",
      partner_creative_id: `partner-${Math.floor(Math.random() * 10000)}`,
      partner_name: partners[0]?.name || "Team",
      partner_role: partners[0]?.role || "Multiple",
      primary_payout_percentage: newPrimarySplit,
      partner_payout_percentage: totalPartnerSplit,
      alliance_status: "PROPOSED",
      contract_specs: {
        partners,
        messages: []
      }
    };

    setAlliances(prev => [newAllianceItem, ...prev]);
    setNewProjName('');
    setPartners([{ name: '', role: '', split: 40 }]);
    triggerNotification("CREW INVITE EXECUTED // PROJECT LEDGER INTIALIZED");
    if (addLog) addLog(`Formed crew "${newProjName}" with ${partners.length} partner(s).`);

    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('creative_alliances').insert({
          id: allianceId,
          project_name: newAllianceItem.project_name,
          band_id: newAllianceItem.band_id,
          total_budget: newAllianceItem.total_budget,
          primary_creative_id: userProfile?.id || null,
          partner_creative_id: null,
          primary_payout_percentage: newAllianceItem.primary_payout_percentage,
          partner_payout_percentage: newAllianceItem.partner_payout_percentage,
          alliance_status: 'PROPOSED',
          contract_specs: newAllianceItem.contract_specs
        });
      }
    } catch (_) {}
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-zinc-100 font-mono text-xs w-full pb-10">
      
      {/* 1. SIMPLIFIED INTAKE FORM */}
      <div className="bg-[#000000] border border-[#262626] p-6 rounded-none flex flex-col space-y-5">
        <h2 className="text-[13px] font-black tracking-widest text-[#A855F7] uppercase mb-2">FORM A CREW</h2>

        <form onSubmit={handleCreateAlliance} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-zinc-500 uppercase font-black tracking-widest text-[9.5px]">[ Project Name / Identifier... ]</label>
            <input 
              type="text" 
              required 
              value={newProjName} 
              onChange={(e) => setNewProjName(e.target.value)} 
              placeholder="e.g. SAVAGE WORLDS"
              className="w-full bg-[#000000] border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] p-3 text-white focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-[#A855F7] border-b border-[#262626] pb-2">
              <span>Partners [{partners.length}]</span>
              <button
                type="button"
                onClick={() => setPartners([...partners, { name: '', role: '', split: 0 }])}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Add Another Partner"
              >
                <Plus className="w-3.5 h-3.5" /> ADD PARTNER
              </button>
            </div>
            {partners.map((partner, idx) => (
              <div key={`creative-lead-item-${idx}`} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0a0a0a] p-4 border border-[#262626] relative">
                {partners.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...partners];
                      updated.splice(idx, 1);
                      setPartners(updated);
                    }}
                    className="absolute top-1 right-1 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="space-y-1.5">
                  <label className="block text-zinc-500 uppercase font-black tracking-widest text-[9.5px]">Partner #{idx + 1}</label>
                  <input 
                    type="text" 
                    required 
                    value={partner.name} 
                    onChange={(e) => {
                      const updated = [...partners];
                      updated[idx].name = e.target.value;
                      setPartners(updated);
                    }} 
                    placeholder="@username"
                    className="w-full bg-[#000000] border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] p-3 text-white focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-zinc-500 uppercase font-black tracking-widest text-[9.5px]">Specialty (Custom Input)</label>
                  <input
                    type="text"
                    required
                    value={partner.role}
                    onChange={(e) => {
                      const updated = [...partners];
                      updated[idx].role = e.target.value;
                      setPartners(updated);
                    }}
                    placeholder="e.g. Master Tech"
                    className="w-full bg-[#000000] border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] p-3 text-white focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-zinc-500 uppercase font-black tracking-widest text-[9.5px]">Share [%]</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    max={100}
                    value={partner.split} 
                    onChange={(e) => {
                      const updated = [...partners];
                      updated[idx].split = e.target.value === '' ? 0 : Number(e.target.value);
                      setPartners(updated);
                    }}
                    className="w-full bg-[#000000] border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] p-3 text-white focus:outline-none transition-colors text-center font-bold"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#262626] pt-5">
            <div className="space-y-1.5">
              <label className="block text-zinc-500 uppercase font-black tracking-widest text-[9.5px]">Your Share: [ % ]</label>
              <input 
                type="number" 
                required 
                min={0}
                max={100}
                value={newPrimarySplit} 
                onChange={(e) => setNewPrimarySplit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#000000] border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] p-3 text-white focus:outline-none transition-colors text-center font-bold"
              />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end pb-3 text-right">
              <span className="text-zinc-500 uppercase font-black tracking-widest text-[9.5px] block mb-2">Total Partner Share</span>
              <span className="text-[14px] font-black">{totalPartnerSplit}%</span>
            </div>
          </div>

          <div className="pt-2 pb-1 text-[10px] font-black uppercase tracking-widest">
            {typeof newPrimarySplit === 'number' && (newPrimarySplit + totalPartnerSplit === 100) ? (
              <span className="text-[#00ffcc]">[ ✓ ] SPLIT MATRIX CALIBRATED</span>
            ) : (
              <span className="text-red-500">[ ! ] TOTAL SPLIT MUST EQUAL 100%</span>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-4 mt-2 uppercase tracking-widest font-black text-[11px] transition-colors border select-none ${isFormValid ? 'bg-[#A855F7] hover:bg-[#b97bf8] text-black border-[#A855F7] cursor-pointer' : 'bg-transparent text-zinc-600 border-[#262626] cursor-not-allowed'}`}
          >
            [ EXECUTE CREW INVITE ]
          </button>
        </form>
      </div>

      {/* 3. CLEAN COMPACT LEDGER ROWS */}
      <div className="bg-[#000000] border border-[#262626] p-6 rounded-none flex flex-col space-y-4">
        <h2 className="text-[13px] font-black tracking-widest text-[#A855F7] uppercase mb-2">YOUR SHARED PROJECTS</h2>

        <div className="space-y-0 border-t border-[#262626]">
          {alliances.map((alliance, idx) => (
            <div
              key={`${alliance.id}-${idx}`}
              className="border-b border-[#262626] py-5 last:border-0 hover:bg-[#050505] transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group"
            >
              <div className="space-y-1.5">
                <span className="text-[12px] font-black text-white uppercase block">{alliance.project_name}</span>
                <span className="text-[10.5px] text-zinc-500 block font-mono">
                  Partner: <span className="text-zinc-300">{alliance.partner_name}</span> // Split: {alliance.primary_payout_percentage}% / {alliance.partner_payout_percentage}%
                </span>
              </div>
              
              <div className="flex items-center gap-6 shrink-0 mt-2 sm:mt-0">
                <span className={`text-[10px] font-black uppercase tracking-widest ${alliance.alliance_status === 'ACTIVE' ? 'text-white' : 'text-zinc-500'}`}>
                  [ STATUS // {alliance.alliance_status === 'ACTIVE' ? 'AGREED' : 'PENDING'} ]
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedAlliance(alliance)}
                  className="text-[10.5px] text-zinc-400 group-hover:text-white transition-colors cursor-pointer font-bold tracking-widest"
                >
                  [ VIEW LEDGER → ]
                </button>
              </div>
            </div>
          ))}
          {alliances.length === 0 && (
            <div className="py-8 text-center text-zinc-500 uppercase tracking-widest text-[10px] font-black">
              No active shared projects
            </div>
          )}
        </div>
      </div>

      {/* LEDGER & MSG CENTER MODAL */}
      {selectedAlliance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="w-full max-w-2xl bg-[#090a0f] border border-[#A855F7]/40 rounded-none p-6 space-y-5 shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-44 h-44 bg-[#A855F7]/10 blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-[#262626] pb-3 relative z-10 shrink-0">
              <div className="space-y-1">
                <span className="text-[10.5px] uppercase font-black text-[#A855F7] tracking-wider block">Project Ledger</span>
                <span className="text-sm font-black text-white block uppercase tracking-wide">{selectedAlliance.project_name}</span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedAlliance(null)}
                className="text-[9px] uppercase font-black text-zinc-400 hover:text-red-400 transition-colors cursor-pointer bg-[#000000] px-2 py-1 rounded-none border border-[#262626]"
              >
                [ Close ]
              </button>
            </div>

            <div className="overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {/* SPLITS INFO */}
              <div className="bg-[#050505] p-4 border border-[#262626] space-y-3">
                <div className="text-[9.5px] text-zinc-500 uppercase tracking-widest font-black border-b border-[#262626] pb-1.5">Distribution Matrix</div>
                <div className="flex justify-between items-center">
                  <span className="text-white text-xs">You (Lead)</span>
                  <span className="text-[#00ffcc] font-bold">{selectedAlliance.primary_payout_percentage}%</span>
                </div>
                {selectedAlliance.partners && selectedAlliance.partners.length > 0 ? (
                  selectedAlliance.partners.map((p: any, idx: number) => (
                    <div key={`creative-alliance-row-${idx}`} className="flex justify-between items-center text-zinc-400 text-xs">
                      <span>{p.name} <span className="text-[9.5px] text-zinc-600 ml-1">({p.role})</span></span>
                      <span>{p.split}%</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-zinc-400 text-xs">
                    <span>{selectedAlliance.partner_name} <span className="text-[9.5px] text-zinc-600 ml-1">({selectedAlliance.partner_role})</span></span>
                    <span>{selectedAlliance.partner_payout_percentage}%</span>
                  </div>
                )}
              </div>

              {/* MESSAGE CENTER */}
              <div className="bg-[#050505] p-4 border border-[#262626] space-y-4 flex flex-col" style={{ minHeight: '300px' }}>
                <div className="text-[9.5px] text-zinc-500 uppercase tracking-widest font-black border-b border-[#262626] pb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Message Center
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {(selectedAlliance.messages && selectedAlliance.messages.length > 0) ? (
                    selectedAlliance.messages.map((msg: any, i: number) => (
                      <div key={`alliance-msg-${msg.id || i}-${i}`} className={`flex flex-col ${msg.sender === (userProfile?.id || 'creative-lead-soren') ? 'items-end' : 'items-start'}`}>
                        <span className="text-[8.5px] text-zinc-600 mb-0.5">{msg.timestamp} // {msg.senderName}</span>
                        <div className={`px-3 py-2 text-xs max-w-[85%] ${msg.sender === (userProfile?.id || 'creative-lead-soren') ? 'bg-[#A855F7]/20 border border-[#A855F7]/40 text-purple-100' : 'bg-zinc-900 border border-zinc-800 text-zinc-200'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-zinc-600 text-[10px] uppercase font-black pt-10">No messages in secure comm link</div>
                  )}
                </div>
                <div className="flex gap-2 isolate pt-2 border-t border-[#262626]">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Transmit message to crew..."
                    className="flex-1 bg-black border border-[#262626] focus:border-[#A855F7] p-2 text-xs text-white outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMessage.trim()) {
                        e.preventDefault();
                        const msg = {
                          text: newMessage.trim(),
                          sender: userProfile?.id || 'creative-lead-soren',
                          senderName: "You",
                          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
                        };
                        const updatedAlliances = alliances.map(a => {
                          if (a.id === selectedAlliance.id) {
                            const newA = { ...a };
                            newA.messages = [...(newA.messages || []), msg];
                            if (newA.contract_specs) newA.contract_specs.messages = newA.messages;
                            setSelectedAlliance(newA);
                            return newA;
                          }
                          return a;
                        });
                        setAlliances(updatedAlliances);
                        setNewMessage('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!newMessage.trim()}
                    onClick={() => {
                      const msg = {
                        text: newMessage.trim(),
                        sender: userProfile?.id || 'creative-lead-soren',
                        senderName: "You",
                        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
                      };
                      const updatedAlliances = alliances.map(a => {
                        if (a.id === selectedAlliance.id) {
                          const newA = { ...a };
                          newA.messages = [...(newA.messages || []), msg];
                          if (newA.contract_specs) newA.contract_specs.messages = newA.messages;
                          setSelectedAlliance(newA);
                          return newA;
                        }
                        return a;
                      });
                      setAlliances(updatedAlliances);
                      setNewMessage('');
                    }}
                    className={`px-3 flex items-center justify-center transition-colors ${newMessage.trim() ? 'bg-[#A855F7] hover:bg-[#b97bf8] text-black cursor-pointer' : 'bg-black border border-[#262626] text-zinc-600 cursor-not-allowed'}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
