import { useState, useEffect } from 'react';
import { TourNote, ChecklistItem, BankItem } from '../types';
import { getSupabase } from '../supabase';

interface UseTourNotesOptions {
  notes: TourNote[];
  setNotes: React.Dispatch<React.SetStateAction<TourNote[]>>;
  isOnline: boolean;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  queueOfflineAction: (type: string, action: string, payload: any) => void;
}

export function useTourNotes({
  notes,
  setNotes,
  isOnline,
  triggerNotification,
  addLog,
  queueOfflineAction
}: UseTourNotesOptions) {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [inlineNoteEditingId, setInlineNoteEditingId] = useState<string | null>(null);
  const [inlineNoteText, setInlineNoteText] = useState('');
  const [inlineNoteCategory, setInlineNoteCategory] = useState<'NOTE' | 'TASK' | 'MEETING'>('NOTE');
  const [inlineNoteTag, setInlineNoteTag] = useState('GENERAL INFO');
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [isTourNotesCardCollapsed, setIsTourNotesCardCollapsed] = useState<boolean>(true);

  const NOTE_CATEGORIES = ['NOTE', 'TASK', 'MEETING', 'IMPORTANT'];
  const NOTE_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'];

  const handleNoteTouchStart = (e: any) => {};
  const handleNoteTouchMove = (e: any) => {};
  const handleNoteTouchEnd = (e: any) => {};

  // Delete Note helper
  const handleDeleteNote = async (id: string) => {
    const supabase = getSupabase();
    if (supabase && isOnline) {
      addLog(`Sending delete request to Supabase notes table for ID [${id}]`);
      try {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) {
          addLog(`Supabase delete error: ${error.message}`);
          queueOfflineAction('note', 'delete', { id });
        }
      } catch (e: any) {
        addLog(`Network failed during delete note. Added to sync queue.`);
        queueOfflineAction('note', 'delete', { id });
      }
    } else {
      queueOfflineAction('note', 'delete', { id });
      addLog(`Local note removed offline.`);
    }
    setNotes(prev => prev.filter(n => n.id !== id));
    setActiveNoteIndex(0);
    triggerNotification('Note removed.');
  };

  // Update Note helper
  const handleUpdateNote = async (id: string, updates: Partial<TourNote>) => {
    const supabase = getSupabase();
    
    // Optimistic update locally
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    triggerNotification('Note updated.');
    addLog(`Note [${id}] updated locally.`);

    if (supabase && isOnline) {
      try {
        const dbUpdates = { ...updates };
        delete dbUpdates.band_id; // don't mutate relations just in case
        const { error } = await supabase.from('notes').update(dbUpdates).eq('id', id);
        if (error) {
          addLog(`Supabase error: ${error.message}`);
          queueOfflineAction('note', 'update', { id, ...dbUpdates });
        }
      } catch (e: any) {
        addLog(`Note update failed networking. Queued globally.`);
        queueOfflineAction('note', 'update', { id, ...updates });
      }
    } else {
      queueOfflineAction('note', 'update', { id, ...updates });
    }
  };

  // Core Crew Checklist states
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_checklist_items');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [].map((item: any) => ({
      id: item.id,
      text: item.text,
      completed: item.completed,
      created_at: item.created_at
    }));
  });

  const [checklistBank, setChecklistBank] = useState<BankItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_checklist_bank');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: 'b_1', text: 'Merch inventory & gear loaded in van' },
      { id: 'b_2', text: 'Merch cash counted & drawer settled' },
      { id: 'b_3', text: 'Settlement report sent to tour manager' },
      { id: 'b_4', text: 'Door guest list sign-offs verified' },
      { id: 'b_5', text: 'Van locks & master deadbolts check' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexus_core_checklist_items', JSON.stringify(checklistItems));
  }, [checklistItems]);

  useEffect(() => {
    localStorage.setItem('nexus_core_checklist_bank', JSON.stringify(checklistBank));
  }, [checklistBank]);

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const nextState = !item.completed;
          const status = nextState ? 'COMPLETED' : 'REOPENED';
          addLog(`Checklist task: "${item.text}" marked as ${status}`);
          triggerNotification(`Task ${status.toLowerCase()}!`);
          return { ...item, completed: nextState };
        }
        return item;
      });
      return updated;
    });
  };

  return {
    isNoteExpanded,
    setIsNoteExpanded,
    inlineNoteEditingId,
    setInlineNoteEditingId,
    inlineNoteText,
    setInlineNoteText,
    inlineNoteCategory,
    setInlineNoteCategory,
    inlineNoteTag,
    setInlineNoteTag,
    activeNoteIndex,
    setActiveNoteIndex,
    isTourNotesCardCollapsed,
    setIsTourNotesCardCollapsed,
    NOTE_CATEGORIES,
    NOTE_STATUSES,
    handleNoteTouchStart,
    handleNoteTouchMove,
    handleNoteTouchEnd,
    handleDeleteNote,
    handleUpdateNote,
    isChecklistModalOpen,
    setIsChecklistModalOpen,
    isFlightModalOpen,
    setIsFlightModalOpen,
    checklistItems,
    setChecklistItems,
    checklistBank,
    setChecklistBank,
    toggleChecklistItem
  };
}
