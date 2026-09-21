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
  // Since ChecklistItem from types.ts doesn't explicitly store priority, we can store it in localStorage or handle it gracefully using helper structures or optional type values.
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
        // Vary priorities logically within bundles to look smart and realistic
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

  // Add custom template item directly to bank
  const handleAddDirectTemplate = () => {
    const trimmed = newTemplateText.trim();
    if (!trimmed) {
      triggerNotification('Enter template description first');
      return;
    }
    if ((bankItems || []).some(b => b.text.toLowerCase() === trimmed.toLowerCase())) {
      triggerNotification('Template already exists in templates bank');
      return;
    }
    const newBankItem: BankItem = {
      id: 'bank_dir_' + Date.now(),
      text: trimmed,
      category: 'User Custom'
    };
    setBankItems(prev => [...prev, newBankItem]);
    setNewTemplateText('');
    triggerNotification('Added template to repository');
  };

  // Remove item from bank
  const handleRemoveTemplateItem = (id: string) => {
    setBankItems(prev => prev.filter(item => item.id !== id));
    triggerNotification('Removed template from bank');
  };

  // Reset entire checklist board back to default standard checklist templates
  const handleHardResetChecklist = () => {
    if (window.confirm('WARNING: This will wipe out all active tour checklist items and reset them back to the default 5 core tasks. Continue?')) {
      const defaultTasks = [
        { text: 'Verify tour vehicle fluids, tire pressure, and trailer locks', priority: 'HIGH' as const },
        { text: 'Ensure starting cash bank matches designated ledger ($250 count)', priority: 'HIGH' as const },
        { text: 'Count-in entire apparel stock, vinyl, and CDs with venue representative', priority: 'MED' as const },
        { text: 'Perform thorough audio soundcheck & map IEM / Mon mix configurations', priority: 'MED' as const },
        { text: 'Double check trailer double-deadbolts and lock the master combination', priority: 'HIGH' as const }
      ];
      
      const newActives: ChecklistItem[] = defaultTasks.map((t, idx) => {
        const itemId = 'active_reset_' + idx + '_' + Date.now();
        savePriority(itemId, t.priority);
        return {
          id: itemId,
          text: t.text,
          completed: false,
          created_at: new Date().toISOString()
        };
      });

      setActiveItems(newActives);
      addLog('[Checklist] Wiped and re-seeded core checklist presets');
      triggerNotification('Cleared and re-seeded core checklist tasks');
    }
  };

  // Filter bank items list
  const filteredTemplateBank = useMemo(() => {
    if (!bankSearch.trim()) return bankItems;
    return bankItems.filter(item => 
      item.text.toLowerCase().includes(bankSearch.toLowerCase())
    );
  }, [bankItems, bankSearch]);

  // Dynamic calculations for overall metrics
  const completedCount = activeItems.filter(i => i.completed).length;
  const totalCount = activeItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Breakdown metrics
  const highPriorityItems = activeItems.filter(i => (itemPriorities[i.id] || 'MED') === 'HIGH');
  const completedHighCount = highPriorityItems.filter(i => i.completed).length;
  const highProgressPercent = highPriorityItems.length > 0 ? Math.round((completedHighCount / highPriorityItems.length) * 100) : 0;

  // Filtered active list for output
  const filteredActiveItems = useMemo(() => {
    const list = [...activeItems];
    // Sort items so uncompleted HIGH priority are first, completed at the bottom
    list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // uncompleted first
      }
      const pA = itemPriorities[a.id] || 'MED';
      const pB = itemPriorities[b.id] || 'MED';
      
      const priorityWeights = { HIGH: 3, MED: 2, LOW: 1 };
      return priorityWeights[pB] - priorityWeights[pA]; // higher priority first
    });

    if (filterType === 'all') return list;
    if (filterType === 'pending') return list.filter(i => !i.completed);
    return list.filter(i => i.completed);
  }, [activeItems, filterType, itemPriorities]);

  const selectedPresetList = useMemo(() => {
    const matched = PRESET_GROUPS.find(g => g.category === selectedPresetCategory);
    return matched ? matched.items : [];
  }, [selectedPresetCategory]);

  return (
    <div className="min-h-screen bg-[#06070a] text-white p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Immersive high impact ambient neon color spots */}
      <div className="absolute top-20 left-12 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#00ffcc]/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-fuchsia-600/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Background static texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] mix-blend-overlay pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10 animate-fade-in">
        
        <p className="text-zinc-500 text-xs text-center px-4 mb-4 mt-1">
          Track your day-of-show routines, load in fast, and save custom checklists so you never leave gear behind.
        </p>

        {/* COMPRESSED METRIC RIBBON */}
        <div className="grid grid-cols-3 gap-2 w-full mb-4 px-1">
          <div className="bg-zinc-950/60 border border-zinc-900 rounded p-2.5 flex flex-col justify-between h-16 relative overflow-hidden">
            <span className="text-zinc-500 text-[10px] uppercase font-semibold">Done</span>
            <span className="text-cyan-400 font-bold text-base">{completedCount} / {totalCount}</span>
            <div className="absolute bottom-0 left-0 h-0.5 bg-zinc-900 w-full">
              <motion.div 
                className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          
          <div className="bg-zinc-950/60 border border-zinc-900 rounded p-2.5 flex flex-col justify-between h-16">
            <span className="text-red-500 text-[10px] uppercase font-semibold">Urgent</span>
            <span className="text-zinc-200 font-bold text-base">{highPriorityItems.filter(i => !i.completed).length}</span>
          </div>
          
          <div className="bg-zinc-950/60 border border-zinc-900 rounded p-2.5 flex flex-col justify-between h-16">
            <span className="text-purple-400 text-[10px] uppercase font-semibold">Templates</span>
            <span className="text-zinc-200 font-bold text-base">{bankItems.length}</span>
          </div>
        </div>

        {/* QUICK-LOAD HORIZONTAL BAR */}
        <div className="flex overflow-x-auto space-x-2 py-2 mb-4 scrollbar-none z-10 relative">
          <button 
            onClick={() => setIsFactoryPresetModalOpen(true)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full text-xs hover:bg-zinc-800 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 font-mono"
          >
            <span className="text-[10px]">📁</span> Load Factory Preset
          </button>
          <button 
            onClick={() => setIsMyTemplatesModalOpen(true)}
            className="bg-purple-950/40 border border-purple-900/60 text-purple-400 px-3 py-1.5 rounded-full text-xs hover:bg-purple-900/40 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 font-mono"
          >
            <span className="text-[10px]">⭐</span> Load My Templates
          </button>
        </div>

        {/* WORKSPACE ACTIVE SUBTAB VIEWPORT */}
        <div className="bg-[#0c0d12] border border-zinc-850 rounded-2xl p-5 md:p-7 shadow-xl">
          
          <div className="space-y-6">
            {/* Crew Intel Radar Warning Cards */}
            {(() => {
              // Extract shows
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

              // Mock Black Book venues and their intel
              const venueIntelMap: Record<string, { name: string; intel: string[] }> = {
                'the echo': {
                  name: 'The Echo',
                  intel: ["Hard cut off at 11:30PM. Load-in through the back alley, very tight squeeze. Payout is always exact and on time.", "The local sound engineer is top-tier. Bring earplugs, it gets very loud inside."]
                },
                'chain reaction': {
                  name: 'Chain Reaction',
                  intel: ["Legendary spot for heavy/punk bands. Front door load-in only. Merch area gets incredibly crowded but moves units.", "Check with Jon about load-in details before 5 PM to secure easy street parking."]
                },
                'bottom of the hill': {
                  name: 'Bottom of the Hill',
                  intel: ["Incredible sound system. Steep stairs for load-in are brutal on cabinets. Ask for the drink tickets early.", "Lynn is super busy but will respond if you follow up once after 4 days."]
                },
                'neumos': {
                  name: 'Neumos',
                  intel: ["Highly professional staff. Green room is huge and stocked. Load-in is easy via the side ramp.", "Merch stand space has its own dedicated power strip. Highly visible to the crowd."]
                },
                'the subterranean club': {
                  name: 'The Subterranean Club',
                  intel: ["Very tight merch area in the basement, expect high heat. Power drops are solid but check grounding on stage."]
                },
                'saint vitus bar': {
                  name: 'Saint Vitus Bar',
                  intel: ["Stage layout is highly compact. Load-in via the main street front. Settlement sheets must be finalized directly upon stage conclusion."]
                },
                'red rocks': {
                  name: 'Red Rocks Amphitheatre',
                  intel: ["Massive altitude differential, stay hydrated. Backstage load-in tunnel is wide but steep. Direct bank settlement sheets required."]
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

              if (alerts.length === 0) return null;

              return (
                <div className="bg-[#180f02] border border-amber-600/40 rounded-xl p-4.5 text-left space-y-2.5 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-xs font-mono font-black text-amber-500 uppercase tracking-widest">
                        ⚠️ AUTOMATED CREW INTEL RADAR INJECTION
                      </span>
                    </div>
                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {alerts.length} Active Warnings
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {alerts.map((alert, index) => (
                      <div key={`tour-chk-${index}`} className="bg-black/40 border border-amber-600/15 rounded-lg p-3 text-xs leading-relaxed text-zinc-300 font-sans">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-400 font-display text-[11px]">{alert.showName}</span>
                          <span className="text-[9px] font-mono text-zinc-500">{new Date(alert.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-amber-500 font-bold font-mono mr-1">Intel Alert:</span>
                          {alert.intelText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
              
              {/* COMPREHENSIVE ACTION CREATION CLUSTER */}
              <div className="bg-[#07080b] border border-zinc-900 rounded-xl p-4.5 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-zinc-900 pb-3">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block font-bold text-left">
                    New Task
                  </span>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">Quick Template:</span>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setNewItemText(val);
                          e.target.value = ""; // resets selector selection index
                        }
                      }}
                      className="bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-violet-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-violet-500 w-full md:max-w-xs cursor-pointer hover:border-violet-500/40"
                    >
                      <option value="">-- DEFAULT TEMPLATES --</option>
                      <option value="Verify all backline amplifiers, drums, and instrument cables are present">🚚 Verify backline instrument gear pack</option>
                      <option value="Print and laminate stage setlists (x5 copies)">📄 Print and laminate stage setlists (x5)</option>
                      <option value="Load in & soundcheck backup acoustic guitars and percussion assets">🎸 Soundcheck backup instruments</option>
                      <option value="Sync and secure wireless IEM (In-Ear Monitor) frequency bands">🔊 Sync wireless IEM monitor frequencies</option>
                      <option value="Verify Stage Plot and Input List are handed to FOH Sound Engineer">🎛️ Hand Stage Plot and Input List to FOH</option>
                      <option value="Secure tour merchandise apparel stock Count-In with house rep">👕 Merch stock Count-In with house rep</option>
                      <option value="Setup merch table gridwalls, display hangers, and price cards">🎪 Setup merch displays</option>
                      <option value="Double-charge Square Reader POS device and backup batteries">🔋 Charge POS device & backups</option>
                      <option value="Acquire local venue starting cash drawer ($250 in small bills)">💰 Acquire local starting cash</option>
                      <option value="Verify Green Room hospitality rider is stocked (clean towels, water)">🛁 Verify Green Room stock</option>
                      <option value="Check main venue stage shore power connection and voltage safety">⚡ Check stage shore power voltage</option>
                      <option value="Count cash vault bank and cross-verify with digital settlement sheets">💸 Count cash vault</option>
                      <option value="Secure final financial payout (cash/check) from venue promoter">🏛️ Secure final payout</option>
                      <option value="Ensure trailer cargo is ratcheted tight and double-padlocked">🔒 Verify trailer cargo is secure</option>
                      <option value="Check weather forecasts for overland transit routing to tomorrow's city">🌤️ Check weather & route safety</option>
                    </select>
                  </div>
                </div>
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleAddNewTask(newItemText, newItemPriority); }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input 
                    type="text"
                    required
                    placeholder="Enter custom task description..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="flex-grow bg-black border border-zinc-800 hover:border-zinc-700 focus:border-violet-500/80 px-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/30 font-sans"
                  />
                  
                  {/* Priority selector block */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <select
                      value={newItemPriority}
                      onChange={(e) => setNewItemPriority(e.target.value as any)}
                      className="bg-black border border-zinc-800 text-[11px] font-mono text-zinc-300 px-3 py-2.5 rounded-lg focus:outline-none focus:border-violet-500 cursor-pointer text-center"
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MED">Med Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>

                    <button 
                      type="submit"
                      className="bg-[#00ffcc] hover:bg-emerald-400 text-black font-black font-mono text-xs cursor-pointer px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md select-none shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      Add Task
                    </button>
                  </div>
                </form>
              </div>

              {/* FILTERS & QUICK CONTROLS */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Show:</span>
                  <div className="flex bg-black border border-zinc-90 w-max rounded-lg overflow-hidden p-0.5">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition font-mono ${
                        filterType === 'all' ? 'bg-violet-950/60 text-violet-300 border-b border-violet-500/30' : 'text-zinc-550 hover:text-zinc-300'
                      }`}
                    >
                      All Tasks ({activeItems.length})
                    </button>
                    <button
                      onClick={() => setFilterType('pending')}
                      className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition font-mono ${
                        filterType === 'pending' ? 'bg-violet-950/60 text-violet-300 border-b border-violet-500/30' : 'text-zinc-550 hover:text-zinc-300'
                      }`}
                    >
                      Pending ({activeItems.filter(i => !i.completed).length})
                    </button>
                    <button
                      onClick={() => setFilterType('completed')}
                      className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition font-mono ${
                        filterType === 'completed' ? 'bg-violet-950/60 text-violet-300 border-b border-violet-500/30' : 'text-zinc-550 hover:text-zinc-300'
                      }`}
                    >
                      Completed ({activeItems.filter(i => i.completed).length})
                    </button>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-zinc-555 text-left sm:text-right">
                  * TAP BOXES TO TOGGLE
                </div>
              </div>

              {/* THE GRID OF DYNAMIC WORKFLOW CARDS - ACTIVE CHECKLIST */}
              <div className="space-y-3">
                {filteredActiveItems.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-zinc-900 rounded-2xl p-6 bg-black/10">
                    <ListTodo className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400 font-bold">No items match your active filter</p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-1 max-w-sm mx-auto leading-relaxed">
                      Wipe the filter or load standard templates from <span className="text-[#00ffcc] hover:underline cursor-pointer" onClick={() => setIsFactoryPresetModalOpen(true)}>Factory Presets</span>!
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredActiveItems.map((item, idx) => {
                      const priority = itemPriorities[item.id] || 'MED';
                      
                      return (
                        <motion.div 
                          key={`${item.id}-${idx}`}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                          className={`relative border-l-2 border-t border-b border-r border-t-zinc-900 border-b-zinc-900 border-r-zinc-900 rounded-xl flex flex-col p-4.5 transition-all duration-300 cursor-pointer group hover:border-r-zinc-800 hover:border-t-zinc-800 hover:border-b-zinc-800 ${
                            item.completed 
                              ? 'bg-zinc-900/20 border-l-emerald-500/50 opacity-60' 
                              : priority === 'HIGH'
                              ? 'bg-zinc-950/80 border-l-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.05)]'
                              : 'bg-zinc-950/60 border-l-cyan-500/50'
                          }`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SELECT' && (e.target as HTMLElement).closest('button') === null) {
                              setExpandedItemId(expandedItemId === item.id ? null : item.id);
                            }
                          }}
                        >
                          <div className="absolute inset-x-0 bottom-0 top-0 left-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:6px_6px] mix-blend-overlay pointer-events-none rounded-xl" />

                          {/* LEFT CONTROL AND WORK TEXT */}
                          <div className="flex items-center gap-4 flex-grow min-w-0 z-10">
                            
                            {/* Tap checkbox wrapper */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleToggleTask(item.id); }}
                              type="button"
                              className="w-7 h-7 rounded-lg bg-black border-2 border-zinc-800 hover:border-[#00ffcc] transition flex items-center justify-center shrink-0 shadow-lg active:scale-95 select-none"
                            >
                              {item.completed ? (
                                <motion.div 
                                  initial={{ scale: 0.7 }}
                                  animate={{ scale: 1 }}
                                  className="w-full h-full rounded-[6px] bg-[#00ffcc] flex items-center justify-center"
                                >
                                  <CheckSquare className="w-5 h-5 text-black stroke-[3]" />
                                </motion.div>
                              ) : (
                                <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800 group-hover:bg-[#00ffcc]/30 transition-colors" />
                              )}
                            </button>

                            {/* Editable Title/Text block */}
                            <div className="flex-grow min-w-0 text-left">
                              {editingItemId === item.id ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text"
                                    value={editingItemText}
                                    onChange={(e) => setEditingItemText(e.target.value)}
                                    className="bg-black text-white text-sm py-1.5 px-3 rounded-lg border border-[#00ffcc] focus:outline-none w-full"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveActiveEdit(item.id);
                                      if (e.key === 'Escape') setEditingItemId(null);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveActiveEdit(item.id)}
                                    className="bg-emerald-500 text-black px-2.5 py-1.5 rounded-lg text-xs font-bold"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span 
                                    className={`text-sm tracking-wide leading-tight font-sans block select-none ${
                                      item.completed ? 'line-through text-zinc-550 italic font-light' : 'text-zinc-100 font-bold'
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* DRAWER WITH ACTIONS */}
                          <AnimatePresence>
                            {expandedItemId === item.id && !editingItemId && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="overflow-hidden z-10"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/50">
                                  <div className="flex items-center gap-1">
                                    <span className="text-zinc-600 text-[10px] font-mono uppercase font-bold block">Priority:</span>
                                    <select
                                      value={priority}
                                      onChange={(e) => savePriority(item.id, e.target.value as any)}
                                      className={`bg-transparent border-none text-[10px] p-1 font-bold tracking-wider cursor-pointer focus:outline-none uppercase ${
                                        priority === 'HIGH' ? 'text-amber-400' : priority === 'MED' ? 'text-cyan-400' : 'text-zinc-400'
                                      }`}
                                    >
                                      <option value="HIGH">CRITICAL</option>
                                      <option value="MED font-semibold">ROUTINE</option>
                                      <option value="LOW">OPTIONAL</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Save to templates */}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSaveToTemplateBank(item.text); }}
                                      title="Export task to reusable Template Bank list"
                                      className="p-1.5 px-2.5 rounded-lg bg-black/60 hover:bg-amber-500 hover:text-black border border-zinc-850 hover:border-amber-400 text-amber-400 font-mono text-[9px] font-black uppercase flex items-center gap-1 transition-all"
                                    >
                                      <Star className="w-3 h-3" />
                                      <span>Bank Template</span>
                                    </button>
        
                                    {/* Inline edit */}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingItemId(item.id);
                                        setEditingItemText(item.text);
                                      }}
                                      className="p-1.5 px-2.5 text-zinc-400 hover:text-[#00ffcc] hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg transition text-[9px] font-mono font-bold uppercase flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      Edit
                                    </button>
        
                                    {/* Delete */}
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleRemoveTask(item.id, item.text); }}
                                      className="p-1.5 px-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-zinc-900 hover:border-red-900/40 rounded-lg transition text-[9px] font-mono font-bold uppercase flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
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

              {/* PLATFORM NOTICE GATEWAY */}
              <div className="bg-black/40 border border-dashed border-zinc-800 p-4 rounded-xl flex items-start gap-3 mt-4 text-left">
                <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black block">Information</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans font-medium">
                    Checklists sync locally. Complete all tasks to ensure tour readiness. Tap <span className="text-violet-400 font-bold uppercase">&quot;Bank Templates&quot;</span> on any item to save it for future use.
                  </p>
                </div>
              </div>

            </div>

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
