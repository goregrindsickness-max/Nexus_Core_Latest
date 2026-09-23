import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ChevronLeft, CheckSquare, Square, Plus, Trash2, Edit3, Save, 
  RotateCcw, Search, BookOpen, ListTodo, Star, CheckCircle2, 
  AlertTriangle, Play, Sparkles, Sliders, Layers, ClipboardList, Info, Trash, X
} from 'lucide-react';
import { ChecklistItem, BankItem } from '../../../types';
import InfoTip from '../../InfoTip';

interface TourChecklistViewProps {
  onBack: () => void;
  activeItems: ChecklistItem[];
  setActiveItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  bankItems: BankItem[];
  setBankItems: React.Dispatch<React.SetStateAction<BankItem[]>>;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  activeBandName?: string;
  disableScrollToTop?: boolean;
}

// Industry-standard fully-populated band checklist categories and items
const PRESET_GROUPS = [
  {
    category: "Tour Logistics & Safety Checks",
    icon: "🚚",
    items: [
      "Verify tour vehicle fluids, tire pressure, and trailer locks",
      "Check vehicle registration, insurance, and fleet fuel cards",
      "Secure all trailer cargo and heavy gear with lockable ratchet straps",
      "Verify active starting cash box bank is fully populated with small bills",
      "Ensure backline cases, backup cables, and venue adapters are pre-packed",
      "Pre-pack personal toiletries, stage clothes, and personal chargers"
    ]
  },
  {
    category: "Merchandise & POS Setup",
    icon: "👕",
    items: [
      "Count-in entire apparel stock, vinyl, and CDs with venue representative",
      "Prepare merch table displays, hangers, grid walls, and price cards",
      "Sync digital POS / Square reader & check physical battery levels",
      "Display clear visual credit card signage and local tax specifications",
      "Verify merchandise printer paper roll reserves and feed sync",
      "Track and pre-allocate loyalty program signup vouchers at key points"
    ]
  },
  {
    category: "Stage & Audio Production",
    icon: "🔊",
    items: [
      "Perform thorough audio soundcheck & map IEM / Mon mix configurations",
      "Verify shore power amperage specs (50A/30A) with house electrician",
      "Audit stage backdrop, drum risers, mic stands, and routing labels",
      "Secure printed physical setlist copies taped to stage floors (x5 copies)",
      "Confirm lighting director (LD) strobe cue templates & visual bounds",
      "Refill stage smoke generators and haze fluid canisters to maximum capacity",
      "Calibrate pedalboards, backup guitar vaults, and drum-head tunings"
    ]
  },
  {
    category: "VIP & Guest Management",
    icon: "🎫",
    items: [
      "Cross-reference guest list additions with house box office and security manager",
      "Check green room contract rider supplies (drinks, clean towels, waters)",
      "Pre-program VIP meet-and-get credentials & merchandise print passes",
      "Confirm load-in credentials for support artist crews & local stage hands",
      "Review curfew time restrictions and local sound penalties with venue manager"
    ]
  },
  {
    category: "Post-Show Settlement & Load-Out",
    icon: "💰",
    items: [
      "Count-out remaining visible inventory stock with venue representative",
      "Collect venue-cut settlement payouts (cash/checks) from local promoter",
      "Wipe down sweat on instruments & securely pack guitar vaults and cases",
      "Cross-check trailer double-deadbolts and lock the master combination",
      "File tonight's absolute sales tally report into Nexus Core database console",
      "Double check green room and dressing space for forgotten phones or gear"
    ]
  }
];

export default function TourChecklistView({
  onBack,
  activeItems,
  setActiveItems,
  bankItems,
  setBankItems,
  triggerNotification,
  addLog,
  activeBandName = 'Artist',
  disableScrollToTop = false
}: TourChecklistViewProps) {
  // State for collapsible radar intel
  const [isRadarIntelExpanded, setIsRadarIntelExpanded] = useState(false);
  
  // Modals for loading templates
  const [isFactoryPresetModalOpen, setIsFactoryPresetModalOpen] = useState(false);
  const [isMyTemplatesModalOpen, setIsMyTemplatesModalOpen] = useState(false);

  // Scroll to top of the page on initial load
  useEffect(() => {
    if (disableScrollToTop) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const scrollableDivs = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollableDivs.forEach(div => {
      div.scrollTop = 0;
    });
  }, [disableScrollToTop]);

  const [newItemText, setNewItemText] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'LOW' | 'MED' | 'HIGH'>('MED');
  const [bankSearch, setBankSearch] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');
  
  // Filtering on active checklist
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>(PRESET_GROUPS[0].category);

  // Inline editing state overrides
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateText, setEditingTemplateText] = useState('');

  // Support customized priorities inside checklist items by attaching dynamic field safely
  const [itemPriorities, setItemPriorities] = useState<Record<string, 'LOW' | 'MED' | 'HIGH'>>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_checklist_priorities');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const savePriority = (itemId: string, prio: 'LOW' | 'MED' | 'HIGH') => {
    setItemPriorities(prev => {
      const updated = { ...prev, [itemId]: prio };
      localStorage.setItem('nexus_core_checklist_priorities', JSON.stringify(updated));
      return updated;
    });
  };

  // Add customized task to list
  const handleAddNewTask = (text: string, priority: 'LOW' | 'MED' | 'HIGH') => {
    const trimmed = text.trim();
    if (!trimmed) {
      triggerNotification('Please enter a task description');
      return;
    }
    const targetId = 'active_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    const newItem: ChecklistItem = {
      id: targetId,
      text: trimmed,
      completed: false,
      created_at: new Date().toISOString()
    };
    savePriority(targetId, priority);
    setActiveItems(prev => [...prev, newItem]);
    setNewItemText('');
    addLog(`[Checklist] Added priority ${priority} task: "${trimmed}"`);
    triggerNotification('Added checklist task');
  };

  // Toggle checklist item complete state
  const handleToggleTask = (id: string) => {
    setActiveItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.completed;
        addLog(`[Checklist] Task "${item.text}" set to ${nextState ? 'COMPLETED' : 'REOPENED'}`);
        triggerNotification(nextState ? 'Task completed' : 'Task reopened');
        return { ...item, completed: nextState };
      }
      return item;
    }));
  };

  // Delete active item
  const handleRemoveTask = (id: string, text: string) => {
    setActiveItems(prev => prev.filter(item => item.id !== id));
    addLog(`[Checklist] Removed task: "${text}"`);
    triggerNotification('Removed from checklist');
  };

  // Save changes to edited task
  const handleSaveActiveEdit = (id: string) => {
    const trimmed = editingItemText.trim();
    if (!trimmed) {
      triggerNotification('Task description cannot be empty');
      return;
    }
    setActiveItems(prev => prev.map(item => item.id === id ? { ...item, text: trimmed } : item));
    setEditingItemId(null);
    setEditingItemText('');
    triggerNotification('Updated task description');
  };

  // Convert an active checklist item into a template to save to the reusable template bank
  const handleSaveToTemplateBank = (text: string) => {
    const trimmed = text.trim();
    if ((bankItems || []).some(b => b.text.toLowerCase() === trimmed.toLowerCase())) {
      triggerNotification('Template already exists in your bank');
      return;
    }
    const newBankItem: BankItem = {
      id: 'bank_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      text: trimmed,
      category: 'Saved Template'
    };
    setBankItems(prev => [...prev, newBankItem]);
    addLog(`[Checklist] Exported preset template: "${trimmed}"`);
    triggerNotification('Saved to templates!');
  };

  // Add individual task from preset library or template bank
  const handleGenericAddTask = (text: string, priority: 'LOW' | 'MED' | 'HIGH' = 'MED') => {
    if ((activeItems || []).some(item => item.text.toLowerCase() === text.toLowerCase())) {
      triggerNotification('This task is already in your active checklist');
      return;
    }
    const targetId = 'active_' + Date.now();
    const newItem: ChecklistItem = {
      id: targetId,
      text: text,
      completed: false,
      created_at: new Date().toISOString()
    };
    savePriority(targetId, priority);
    setActiveItems(prev => [...prev, newItem]);
    addLog(`[Checklist] Import preset: "${text}"`);
    triggerNotification('Added preset task to crew board');
  };

  // Add entire category bundle of preset tasks at once
  const handleImportPresetCategoryBundle = (categoryName: string) => {
    const matchedGroup = PRESET_GROUPS.find(g => g.category === categoryName);
    if (!matchedGroup) return;

    let addedCount = 0;
    const nextActives = [...activeItems];
    
    matchedGroup.items.forEach((itemText, index) => {
      if (!(nextActives || []).some(a => a.text.toLowerCase() === itemText.toLowerCase())) {
        const targetId = 'preset_bundle_' + index + '_' + Date.now();
        const newItem: ChecklistItem = {
          id: targetId,
          text: itemText,
          completed: false,
          created_at: new Date().toISOString()
        };
        const bundlePriority = index % 3 === 0 ? 'HIGH' : index % 3 === 1 ? 'MED' : 'LOW';
        savePriority(targetId, bundlePriority);
        nextActives.push(newItem);
        addedCount++;
      }
    });

    if (addedCount === 0) {
      triggerNotification('All bundle tasks are already in your active checklist.');
      return;
    }

    setActiveItems(nextActives);
    addLog(`[Checklist] Loaded complete preset bundle: "${categoryName}" (${addedCount} tasks)`);
    triggerNotification(`Bundled ${addedCount} tasks deploy successful!`);
  };

  // Dynamic calculations for overall metrics
  const completedCount = activeItems.filter(i => i.completed).length;
  const totalCount = activeItems.length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Breakdown metrics
  const highPriorityItems = activeItems.filter(i => (itemPriorities[i.id] || 'MED') === 'HIGH');
  const urgentPendingCount = highPriorityItems.filter(i => !i.completed).length;

  // Filtered active list for output
  const filteredActiveItems = useMemo(() => {
    const list = [...activeItems];
    list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const pA = itemPriorities[a.id] || 'MED';
      const pB = itemPriorities[b.id] || 'MED';
      
      const priorityWeights = { HIGH: 3, MED: 2, LOW: 1 };
      return priorityWeights[pB] - priorityWeights[pA];
    });

    if (filterType === 'all') return list;
    if (filterType === 'pending') return list.filter(i => !i.completed);
    return list.filter(i => i.completed);
  }, [activeItems, filterType, itemPriorities]);

  // Venue radar intel extraction
  const radarAlerts = useMemo(() => {
    const localShowsStr = localStorage.getItem('nexus_core_shows_offline');
    let showsList = [];
    if (localShowsStr) {
      try {
        showsList = JSON.parse(localShowsStr);
      } catch (e) {}
    }
    if (!showsList || showsList.length === 0) {
      showsList = [
        { name: "The Subterranean Club", date: "2026-05-26", city: "Chicago" },
        { name: "Saint Vitus Bar", date: "2026-05-28", city: "Brooklyn" }
      ];
    }

    const venueIntelMap: Record<string, { name: string; intel: string[] }> = {
      'the echo': {
        name: 'The Echo',
        intel: ["Hard cut off at 11:30PM. Load-in through back alley.", "Top-tier audio. Bring earplugs."]
      },
      'chain reaction': {
        name: 'Chain Reaction',
        intel: ["Front door load-in only. Merch area moves high volume.", "Connect with Jon before 5PM for street parking."]
      },
      'bottom of the hill': {
        name: 'Bottom of the Hill',
        intel: ["Steep stairs for load-in. Request drink tickets early."]
      },
      'neumos': {
        name: 'Neumos',
        intel: ["Side ramp load-in. Merch stand has dedicated power strip."]
      },
      'the subterranean club': {
        name: 'The Subterranean Club',
        intel: ["Basement merch spot gets warm. Check stage power grounding."]
      },
      'saint vitus bar': {
        name: 'Saint Vitus Bar',
        intel: ["Main street load-in. Finalize settlement right after set."]
      },
      'red rocks': {
        name: 'Red Rocks Amphitheatre',
        intel: ["Altitude differential: hydrate. Backstage tunnel is wide but steep."]
      }
    };

    const alerts: Array<{ showName: string; date: string; intelText: string }> = [];
    showsList.forEach((show: any) => {
      const showNameLower = show.name?.toLowerCase() || '';
      const matchedKey = Object.keys(venueIntelMap).find(key => showNameLower.includes(key));
      if (matchedKey) {
        const venueData = venueIntelMap[matchedKey];
        venueData.intel.forEach(intelText => {
          alerts.push({
            showName: venueData.name,
            date: show.date,
            intelText
          });
        });
      }
    });
    return alerts;
  }, []);

  return (
    <div className="min-h-screen bg-[#06070a] text-white p-3 sm:p-5 font-sans relative overflow-hidden">
      {/* Immersive ambient glow spots */}
      <div className="absolute top-16 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#00ffcc]/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto space-y-3 relative z-10 animate-fade-in">
        
        {/* 1. COLLAPSIBLE INTEL RADAR PILL / ALERT BADGE */}
        {radarAlerts.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setIsRadarIntelExpanded(prev => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border transition-all text-xs font-mono cursor-pointer ${
                isRadarIntelExpanded
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-600/30 text-amber-400 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span className="font-bold tracking-wider uppercase text-[11px]">
                  Crew Intel Radar:
                </span>
                <span className="text-zinc-300 truncate text-[11px]">
                  {radarAlerts.length} Venue Warnings Active
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {isRadarIntelExpanded ? 'Hide ▲' : 'View ▼'}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isRadarIntelExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="bg-[#120b02] border border-amber-600/30 rounded-xl p-3 space-y-2 max-h-56 overflow-y-auto">
                    {radarAlerts.map((alert, index) => (
                      <div key={`radar-alert-${index}`} className="bg-black/50 border border-amber-600/20 rounded-lg p-2.5 text-xs text-zinc-300">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-400 text-[11px]">{alert.showName}</span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(alert.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          <span className="text-amber-400 font-semibold mr-1">Alert:</span>
                          {alert.intelText}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 2. UNIFIED CONTROL ROW (Stats, Progress, Filters & Templates) */}
        <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
          
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Unified Status Filters & Progress */}
            <div className="flex items-center gap-1.5 bg-black/60 border border-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700/60 text-zinc-300">
                  {totalCount}
                </span>
              </button>
              
              <button
                onClick={() => setFilterType('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'pending'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Pending
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400">
                  {pendingCount}
                </span>
              </button>
              
              <button
                onClick={() => setFilterType('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'completed'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Done
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400">
                  {completedCount}
                </span>
              </button>
            </div>

            {/* Quick Urgent Alert Pill & Template Triggers */}
            <div className="flex items-center gap-2">
              {urgentPendingCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-800/50 text-red-400 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span>{urgentPendingCount} Urgent</span>
                </div>
              )}

              <button 
                onClick={() => setIsFactoryPresetModalOpen(true)}
                title="Load Factory Checklist Presets"
                className="bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 px-2.5 py-1.5 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📁</span>
                <span className="hidden sm:inline">Presets</span>
              </button>

              <button 
                onClick={() => setIsMyTemplatesModalOpen(true)}
                title="Load My Saved Templates"
                className="bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 text-purple-300 px-2.5 py-1.5 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>⭐</span>
                <span className="hidden sm:inline">Templates</span>
                <span className="text-[10px] opacity-70">({bankItems.length})</span>
              </button>
            </div>
          </div>

          {/* Inline Micro Progress Indicator */}
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden flex items-center">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(0,255,204,0.4)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* 3. FLATTENED SINGLE-ROW QUICK-ADD BAR */}
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            handleAddNewTask(newItemText, newItemPriority); 
          }}
          className="bg-[#0c0d12] border border-zinc-800 hover:border-zinc-700 focus-within:border-cyan-500/60 rounded-2xl p-2 flex items-center gap-2 transition-all shadow-lg"
        >
          {/* Quick Template Trigger Dropdown (Integrated) */}
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setNewItemText(val);
                e.target.value = "";
              }
            }}
            aria-label="Select Quick Template"
            className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-2.5 py-2 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[40px] sm:max-w-[130px] font-mono shrink-0"
          >
            <option value="">⚡ Template</option>
            <option value="Verify all backline amplifiers, drums, and instrument cables are present">🚚 Backline gear pack</option>
            <option value="Print and laminate stage setlists (x5 copies)">📄 Print setlists (x5)</option>
            <option value="Load in & soundcheck backup instruments">🎸 Soundcheck gear</option>
            <option value="Sync and secure wireless IEM monitor frequencies">🔊 Sync IEM monitors</option>
            <option value="Hand Stage Plot and Input List to FOH Sound Engineer">🎛️ Hand Plot to FOH</option>
            <option value="Merch stock Count-In with house rep">👕 Merch Count-In</option>
            <option value="Setup merch table displays and price cards">🎪 Setup merch table</option>
            <option value="Charge Square Reader POS device & backups">🔋 Charge POS reader</option>
            <option value="Acquire starting cash drawer ($250 in small bills)">💰 Starting cash bank</option>
            <option value="Verify Green Room hospitality rider is stocked">🛁 Green Room check</option>
            <option value="Verify stage shore power connection & voltage">⚡ Shore power check</option>
            <option value="Count cash vault bank and cross-verify with settlement">💸 Count cash vault</option>
            <option value="Secure final settlement payout from promoter">🏛️ Secure payout</option>
            <option value="Ensure trailer cargo is ratcheted & double-padlocked">🔒 Lock trailer cargo</option>
          </select>

          {/* Clean Input Field */}
          <input 
            type="text"
            required
            placeholder="Add task or select template..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="flex-grow bg-transparent border-none px-2 py-1.5 text-sm text-white focus:outline-none placeholder:text-zinc-600 font-sans min-w-0"
          />
          
          {/* Streamlined Priority Toggle */}
          <select
            value={newItemPriority}
            onChange={(e) => setNewItemPriority(e.target.value as any)}
            className={`bg-zinc-900 border border-zinc-800 text-[11px] font-mono px-2 py-2 rounded-xl focus:outline-none cursor-pointer shrink-0 font-bold ${
              newItemPriority === 'HIGH' ? 'text-amber-400' : newItemPriority === 'MED' ? 'text-cyan-400' : 'text-zinc-400'
            }`}
          >
            <option value="HIGH">CRIT</option>
            <option value="MED">MED</option>
            <option value="LOW">LOW</option>
          </select>

          {/* High-Speed Add Button */}
          <button 
            type="submit"
            className="bg-[#00ffcc] hover:bg-emerald-400 active:scale-95 text-black font-black font-mono text-xs cursor-pointer px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>

        {/* 4. OPTIMIZED ONE-TAP CHECKLIST ITEMS LIST */}
        <div className="space-y-2">
          {filteredActiveItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-850 rounded-2xl p-6 bg-[#0c0d12]/40">
              <ListTodo className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">No matching checklist items</p>
              <p className="text-[11px] text-zinc-500 font-mono mt-1">
                Add a task above or load from{' '}
                <span 
                  className="text-[#00ffcc] hover:underline cursor-pointer font-bold" 
                  onClick={() => setIsFactoryPresetModalOpen(true)}
                >
                  Factory Presets
                </span>.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredActiveItems.map((item, idx) => {
                const priority = itemPriorities[item.id] || 'MED';
                const isExpanded = expandedItemId === item.id;
                
                return (
                  <motion.div 
                    key={`${item.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={`relative border rounded-xl flex flex-col p-3 transition-all duration-150 cursor-pointer select-none group ${
                      item.completed 
                        ? 'bg-zinc-950/40 border-zinc-900 opacity-60' 
                        : priority === 'HIGH'
                        ? 'bg-[#140f0a] border-amber-600/40 hover:border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.06)]'
                        : 'bg-[#0c0d12] border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SELECT' && (e.target as HTMLElement).closest('button') === null) {
                        setExpandedItemId(isExpanded ? null : item.id);
                      }
                    }}
                  >
                    {/* Primary Row: 1-Tap Checkbox + Label + Quick Action */}
                    <div className="flex items-center gap-3 w-full">
                      
                      {/* Generous 1-Tap Checkbox Target (44px mobile reach) */}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleToggleTask(item.id); 
                        }}
                        type="button"
                        className="w-8 h-8 rounded-xl bg-black border border-zinc-750 hover:border-[#00ffcc] active:scale-90 transition-transform flex items-center justify-center shrink-0 cursor-pointer shadow-inner"
                      >
                        {item.completed ? (
                          <motion.div 
                            initial={{ scale: 0.6 }}
                            animate={{ scale: 1 }}
                            className="w-full h-full rounded-xl bg-emerald-400 flex items-center justify-center text-black"
                          >
                            <CheckSquare className="w-5 h-5 text-black stroke-[3]" />
                          </motion.div>
                        ) : (
                          <div className={`w-3 h-3 rounded-md transition-colors ${
                            priority === 'HIGH' ? 'bg-amber-500/40 group-hover:bg-amber-400' : 'bg-zinc-800 group-hover:bg-[#00ffcc]/40'
                          }`} />
                        )}
                      </button>

                      {/* Task Text or Edit Form */}
                      <div className="flex-grow min-w-0">
                        {editingItemId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={editingItemText}
                              onChange={(e) => setEditingItemText(e.target.value)}
                              className="bg-black text-white text-xs py-1.5 px-3 rounded-lg border border-[#00ffcc] focus:outline-none w-full"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveActiveEdit(item.id);
                                if (e.key === 'Escape') setEditingItemId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveActiveEdit(item.id)}
                              className="bg-emerald-400 text-black px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span 
                              className={`text-xs sm:text-sm font-sans block transition-colors leading-snug ${
                                item.completed 
                                  ? 'line-through text-zinc-500 italic' 
                                  : priority === 'HIGH'
                                  ? 'text-amber-100 font-semibold'
                                  : 'text-zinc-200 font-medium'
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Priority Tag & Toggle expand */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          priority === 'HIGH' 
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' 
                            : priority === 'MED'
                            ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}>
                          {priority}
                        </span>
                      </div>
                    </div>
                    
                    {/* Collapsible Quick Actions Drawer on Item Tap */}
                    <AnimatePresence>
                      {isExpanded && !editingItemId && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-2.5 pt-2 border-t border-zinc-800/60"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-zinc-500 text-[10px] font-mono uppercase font-bold">Priority:</span>
                              <div className="flex bg-black/60 rounded-lg p-0.5 border border-zinc-800">
                                {(['HIGH', 'MED', 'LOW'] as const).map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      savePriority(item.id, p);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition ${
                                      priority === p 
                                        ? p === 'HIGH' ? 'bg-amber-500 text-black' : p === 'MED' ? 'bg-cyan-500 text-black' : 'bg-zinc-700 text-white'
                                        : 'text-zinc-500 hover:text-white'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Bank Template */}
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleSaveToTemplateBank(item.text); 
                                }}
                                title="Save to template bank"
                                className="p-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-800 text-amber-400 text-[10px] font-mono font-bold uppercase flex items-center gap-1 transition"
                              >
                                <Star className="w-3 h-3" />
                                <span className="hidden sm:inline">Template</span>
                              </button>
  
                              {/* Edit */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItemId(item.id);
                                  setEditingItemText(item.text);
                                }}
                                className="p-1.5 px-2 text-zinc-400 hover:text-[#00ffcc] hover:bg-zinc-900 border border-zinc-800 rounded-lg transition text-[10px] font-mono font-bold uppercase flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </button>
  
                              {/* Delete */}
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleRemoveTask(item.id, item.text); 
                                }}
                                className="p-1.5 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/40 rounded-lg transition text-[10px] font-mono font-bold uppercase flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Del
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

      </div>
      {/* FACTORY PRESETS MODAL */}
      <AnimatePresence>
        {isFactoryPresetModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0b0c10] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
                <span className="font-mono text-zinc-300 font-bold uppercase tracking-widest text-xs">Load Factory Preset</span>
                <button onClick={() => setIsFactoryPresetModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                {PRESET_GROUPS.map((g, gIdx) => (
                  <div key={`${g.category}-${gIdx}`} className="border border-zinc-900 rounded-xl p-3 bg-black/40">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-white flex items-center gap-2">{g.icon} {g.category.toUpperCase()}</span>
                      <button 
                        onClick={() => {
                          handleImportPresetCategoryBundle(g.category);
                          setIsFactoryPresetModalOpen(false);
                        }}
                        className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-lg font-mono uppercase transition-colors cursor-pointer"
                      >
                        Load All
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mb-2">{g.items.length} Tasks included</p>
                    <div className="flex flex-wrap gap-2">
                      {g.items.slice(0, 3).map((item, idx) => (
                        <span key={`tour-chk-tag-${idx}`} className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] px-2 py-1 rounded truncate max-w-[200px]">
                          {item}
                        </span>
                      ))}
                      {g.items.length > 3 && <span className="text-zinc-600 text-[10px] px-1 py-1">+{g.items.length - 3} more</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MY TEMPLATES MODAL */}
      <AnimatePresence>
        {isMyTemplatesModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0b0c10] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
                <span className="font-mono text-zinc-300 font-bold uppercase tracking-widest text-xs">My Saved Templates</span>
                <button onClick={() => setIsMyTemplatesModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {bankItems.length === 0 ? (
                   <div className="text-center py-8 text-zinc-500 font-mono text-xs">No saved templates found.</div>
                ) : (
                  bankItems.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between items-center p-3 border border-zinc-900 rounded-xl bg-black/40 hover:border-zinc-800 transition-colors">
                      <span className="text-sm text-zinc-300 font-sans truncate pr-4">{item.text}</span>
                      <button 
                        onClick={() => {
                          handleGenericAddTask(item.text, 'MED');
                          setIsMyTemplatesModalOpen(false);
                        }}
                        className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded-lg font-mono uppercase transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
