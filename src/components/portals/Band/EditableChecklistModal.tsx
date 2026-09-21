import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CheckSquare, Square, Plus, Trash2, Edit3, Save, 
  FolderPlus, RotateCcw, Search, BookOpen, ListTodo, Star 
} from 'lucide-react';
import { ChecklistItem, BankItem } from '../../../types';

interface EditableChecklistModalProps {
  onClose: () => void;
  activeItems: ChecklistItem[];
  setActiveItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  bankItems: BankItem[];
  setBankItems: React.Dispatch<React.SetStateAction<BankItem[]>>;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
}

export default function EditableChecklistModal({
  onClose,
  activeItems,
  setActiveItems,
  bankItems,
  setBankItems,
  triggerNotification,
  addLog
}: EditableChecklistModalProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'bank'>('checklist');
  const [newItemText, setNewItemText] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [newBankText, setNewBankText] = useState('');
  
  // Tracking item editing state
  const [editingActiveId, setEditingActiveId] = useState<string | null>(null);
  const [editingActiveText, setEditingActiveText] = useState('');
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingBankText, setEditingBankText] = useState('');

  // Add customized item to the active checklist
  const handleAddActiveItem = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      triggerNotification('Please enter a task description');
      return;
    }
    const newItem: ChecklistItem = {
      id: 'active_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      text: trimmed,
      completed: false,
      created_at: new Date().toISOString()
    };
    setActiveItems(prev => [...prev, newItem]);
    setNewItemText('');
    addLog(`Added checklist item: "${trimmed}"`);
    triggerNotification('Added checklist item');
  };

  // Toggle active item completion
  const handleToggleActiveItem = (id: string) => {
    setActiveItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.completed;
        addLog(`Checklist task "${item.text}" set to ${nextState ? 'COMPLETED' : 'REOPENED'}`);
        triggerNotification(nextState ? 'Task completed' : 'Task reopened');
        return { ...item, completed: nextState };
      }
      return item;
    }));
  };

  // Remove active item
  const handleRemoveActiveItem = (id: string, text: string) => {
    setActiveItems(prev => prev.filter(item => item.id !== id));
    addLog(`Removed checklist item: "${text}"`);
    triggerNotification('Removed from checklist');
  };

  // Start editing active item
  const handleStartEditActive = (item: ChecklistItem) => {
    setEditingActiveId(item.id);
    setEditingActiveText(item.text);
  };

  // Save edited active item
  const handleSaveEditActive = (id: string) => {
    const trimmed = editingActiveText.trim();
    if (!trimmed) {
      triggerNotification('Description cannot be empty');
      return;
    }
    setActiveItems(prev => prev.map(item => item.id === id ? { ...item, text: trimmed } : item));
    setEditingActiveId(null);
    setEditingActiveText('');
    triggerNotification('Updated checklist item');
  };

  // Add current active item to reusable bank
  const handleSaveToBank = (text: string) => {
    const trimmed = text.trim();
    if ((bankItems || []).some(b => b.text.toLowerCase() === trimmed.toLowerCase())) {
      triggerNotification('Item already exists in the bank');
      return;
    }
    const newBankItem: BankItem = {
      id: 'bank_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      text: trimmed
    };
    setBankItems(prev => [...prev, newBankItem]);
    addLog(`Saved checklist template to bank: "${trimmed}"`);
    triggerNotification('Saved to templates!');
  };

  // Add item from template bank into active checklist
  const handleAddFromBank = (bankItem: BankItem) => {
    // Check if already in active checklist
    if ((activeItems || []).some(item => item.text.toLowerCase() === bankItem.text.toLowerCase())) {
      triggerNotification('This task is already in your checklist');
      return;
    }
    const newItem: ChecklistItem = {
      id: 'active_from_bank_' + Date.now(),
      text: bankItem.text,
      completed: false,
      created_at: new Date().toISOString()
    };
    setActiveItems(prev => [...prev, newItem]);
    addLog(`Restored template item: "${bankItem.text}"`);
    triggerNotification('Added from bank');
  };

  // Add custom item directly to bank
  const handleAddDirectToBank = () => {
    const trimmed = newBankText.trim();
    if (!trimmed) {
      triggerNotification('Enter template description');
      return;
    }
    if ((bankItems || []).some(b => b.text.toLowerCase() === trimmed.toLowerCase())) {
      triggerNotification('Already exists in the template bank');
      return;
    }
    const newBankItem: BankItem = {
      id: 'bank_' + Date.now(),
      text: trimmed
    };
    setBankItems(prev => [...prev, newBankItem]);
    setNewBankText('');
    triggerNotification('Added directly to templates bank');
  };

  // Delete item from bank
  const handleRemoveBankItem = (id: string, text: string) => {
    setBankItems(prev => prev.filter(item => item.id !== id));
    triggerNotification('Removed template');
  };

  // Start editing bank item
  const handleStartEditBank = (item: BankItem) => {
    setEditingBankId(item.id);
    setEditingBankText(item.text);
  };

  // Save edited bank item
  const handleSaveEditBank = (id: string) => {
    const trimmed = editingBankText.trim();
    if (!trimmed) {
      triggerNotification('Template cannot be empty');
      return;
    }
    setBankItems(prev => prev.map(item => item.id === id ? { ...item, text: trimmed } : item));
    setEditingBankId(null);
    setEditingBankText('');
    triggerNotification('Updated template item');
  };

  // Reset active tasks back to the template defaults
  const handleResetChecklistToDefault = () => {
    if (window.confirm('Reset the checklist? This replaces active tasks with default template tasks.')) {
      const defaultTasks = bankItems.length > 0 ? bankItems : [
        { id: 'b_1', text: 'Merch inventory & gear loaded in van' },
        { id: 'b_2', text: 'Merch cash counted & drawer settled' },
        { id: 'b_3', text: 'Settlement report sent to tour manager' },
        { id: 'b_4', text: 'Door guest list sign-offs verified' },
        { id: 'b_5', text: 'Van locks & master deadbolts check' }
      ];
      
      const newActives: ChecklistItem[] = defaultTasks.map((t, idx) => ({
        id: 'active_reset_' + idx + '_' + Date.now(),
        text: t.text,
        completed: false,
        created_at: new Date().toISOString()
      }));
      setActiveItems(newActives);
      addLog('Reset checklist tasks to defaults');
      triggerNotification('Checklist reset successfully');
    }
  };

  // Filter bank list
  const filteredBankItems = useMemo(() => {
    if (!bankSearch.trim()) return bankItems;
    return bankItems.filter(item => 
      item.text.toLowerCase().includes(bankSearch.toLowerCase())
    );
  }, [bankItems, bankSearch]);

  const completedCount = activeItems.filter(i => i.completed).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0b0d13] w-full max-w-md rounded-[32px] border border-zinc-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
      >
        {/* HEADER */}
        <div className="p-6 pb-4 border-b border-zinc-850">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-teal-400" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white tracking-tight">Active Checklist</h2>
                <p className="text-xs text-zinc-400 font-mono">Organize core band actions</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-mono bg-zinc-950/40 border border-zinc-850 rounded-xl px-4 py-2.5">
            <span className="text-zinc-500 uppercase tracking-wider">Progress</span>
            <span className="text-[#00ffcc] font-black">
              {completedCount} / {activeItems.length} COMPLETED
            </span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-zinc-850 bg-black/10">
          <button 
            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'checklist' 
                ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/5' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setActiveTab('checklist')}
          >
            Checklist ({activeItems.length})
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'bank' 
                ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/5' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setActiveTab('bank')}
          >
            Template Bank ({bankItems.length})
          </button>
        </div>

        {/* BODY TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[480px]">
          
          {/* TAB 1: ACTIVE CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              {/* Input for new active task */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleAddActiveItem(newItemText); }}
                className="flex gap-2"
              >
                <input 
                  type="text"
                  placeholder="Add custom task to checklist..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="flex-1 bg-zinc-900 text-sm border-b-2 border-zinc-850 px-3 py-2.5 text-white focus:outline-none focus:border-[#00ffcc] transition-all rounded-lg"
                />
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-black font-bold p-2.5 rounded-xl transition duration-150 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </form>

              {/* Reset to defaults & add logs indicators */}
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                <span>ACTIVE TOUR CHECKLIST ITEMS</span>
                <button 
                  onClick={handleResetChecklistToDefault}
                  className="flex items-center gap-1 text-teal-400 hover:text-[#00ffcc] font-bold uppercase transition"
                >
                  <RotateCcw className="w-3 h-3" /> Reset default
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {activeItems.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-zinc-850 rounded-2xl p-6">
                    <ListTodo className="w-8 h-8 text-zinc-650 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400 font-semibold mb-1">Your checklist is empty</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Create custom items above or load presets from the template bank tab.</p>
                  </div>
                ) : (
                  activeItems.map((item, idx) => (
                    <motion.div 
                      key={`${item.id}-${idx}`}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        item.completed 
                          ? 'bg-[#131f18]/30 border-emerald-900/30' 
                          : 'bg-zinc-900/40 border-zinc-850 hover:bg-zinc-850/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-grow min-w-0 pr-2">
                        {/* Checkbox */}
                        <button 
                          onClick={() => handleToggleActiveItem(item.id)}
                          className="text-zinc-400 hover:text-[#00ffcc] transition shrink-0"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4.5 h-4.5 text-[#00ffcc]" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-zinc-600" />
                          )}
                        </button>

                        {/* Text (Editable inline) */}
                        {editingActiveId === item.id ? (
                          <input 
                            type="text"
                            value={editingActiveText}
                            onChange={(e) => setEditingActiveText(e.target.value)}
                            onBlur={() => handleSaveEditActive(item.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditActive(item.id)}
                            className="bg-zinc-950 text-white text-xs p-1 px-2 rounded border border-teal-500 focus:outline-none w-full"
                            autoFocus
                          />
                        ) : (
                          <span 
                            onClick={() => handleToggleActiveItem(item.id)}
                            className={`text-xs text-left leading-tight truncate cursor-pointer select-none font-medium ${
                              item.completed ? 'line-through text-zinc-550' : 'text-zinc-200'
                            }`}
                          >
                            {item.text}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100 transition">
                        {/* Star/Bank Template Button */}
                        <button 
                          onClick={() => handleSaveToBank(item.text)}
                          title="Save this task to template bank"
                          className="p-1 px-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-black text-amber-500 transition-all text-[9px] font-bold flex items-center gap-0.5"
                        >
                          <Star className="w-3 h-3 fill-amber-500/20 group-hover:fill-black" />
                          <span>Bank</span>
                        </button>

                        {editingActiveId === item.id ? (
                          <button 
                            onClick={() => handleSaveEditActive(item.id)}
                            className="p-1.5 text-emerald-400 hover:bg-zinc-800 rounded-lg"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStartEditActive(item)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button 
                          onClick={() => handleRemoveActiveItem(item.id, item.text)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-850 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REUSABLE ITEM BANK & TEMPLATES */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              {/* Direct bank template creation helper */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleAddDirectToBank(); }}
                className="flex gap-2"
              >
                <input 
                  type="text"
                  placeholder="New reusable template item..."
                  value={newBankText}
                  onChange={(e) => setNewBankText(e.target.value)}
                  className="flex-1 bg-zinc-900 text-sm border-b-2 border-zinc-850 px-3 py-2.5 text-white focus:outline-none focus:border-[#00ffcc] transition-all rounded-lg"
                />
                <button 
                  type="submit"
                  title="Add direct to template bank"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold p-2.5 rounded-xl transition duration-150 flex items-center justify-center"
                >
                  <FolderPlus className="w-5 h-5" />
                </button>
              </form>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input 
                  type="text"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Search template bank..."
                  className="w-full bg-zinc-950 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-zinc-850 focus:outline-none focus:border-[#00ffcc]"
                />
              </div>

              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                TAp template to instantly add to active checklist
              </div>

              {/* Reusable Templates Bank List */}
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {filteredBankItems.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 font-mono text-xs">
                    {bankSearch ? 'No matches found' : 'The template bank is empty'}
                  </div>
                ) : (
                  filteredBankItems.map((item, idx) => (
                    <div 
                      key={`${item.id}-${idx}`}
                      className="group flex items-center justify-between p-2 px-3 border border-zinc-900 bg-zinc-905/30 hover:bg-zinc-900 rounded-xl transition-all"
                    >
                      {/* Active click adds to current checklist */}
                      <button 
                        onClick={() => handleAddFromBank(item)}
                        className="flex-grow text-left text-xs font-sans text-zinc-300 font-medium py-1 hover:text-[#00ffcc] transition leading-tight flex items-center gap-2"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {editingBankId === item.id ? (
                          <input 
                            type="text"
                            value={editingBankText}
                            onChange={(e) => setEditingBankText(e.target.value)}
                            onBlur={() => handleSaveEditBank(item.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditBank(item.id)}
                            onClick={(e) => e.stopPropagation()} // stop toggle adding
                            className="bg-zinc-950 text-white text-xs p-1 px-1.5 rounded border border-amber-500 focus:outline-none w-full"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate max-w-[200px]">{item.text}</span>
                        )}
                      </button>

                      {/* Modify template directly */}
                      <div className="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition">
                        {editingBankId === item.id ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSaveEditBank(item.id); }}
                            className="p-1 text-emerald-400 hover:bg-zinc-850 rounded-md"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartEditBank(item); }}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-850 rounded-md transition"
                            title="Edit template name"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveBankItem(item.id, item.text); }}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-850 rounded-md transition"
                          title="Delete from templates bank"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-5 bg-black/20 border-t border-zinc-850 flex gap-3">
          <button 
            onClick={onClose}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono font-bold py-3.5 rounded-xl transition uppercase tracking-widest active:scale-95"
          >
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
