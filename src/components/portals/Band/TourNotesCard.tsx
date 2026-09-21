import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  MapPin, 
  Tag, 
  Trash2 
} from 'lucide-react';
import { TourNote, Show } from '../../../types';

const NOTE_CATEGORIES = ['NOTE', 'TASK', 'MEETING'];
const NOTE_STATUSES = ['GENERAL INFO', 'URGENT', 'COMPLETE', 'IMPORTANT', 'LOOK INTO'];

interface TourNotesCardProps {
  setIsGlobalHoverPaused: (paused: boolean) => void;
  handleNoteTouchStart: (e: React.TouchEvent) => void;
  handleNoteTouchMove: (e: React.TouchEvent) => void;
  handleNoteTouchEnd: () => void;
  
  filteredNotes: TourNote[];
  isNoteExpanded: boolean;
  setIsNoteExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  inlineNoteEditingId: string | null;
  setInlineNoteEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  inlineNoteText: string;
  setInlineNoteText: React.Dispatch<React.SetStateAction<string>>;
  inlineNoteCategory: 'NOTE' | 'TASK' | 'MEETING';
  setInlineNoteCategory: React.Dispatch<React.SetStateAction<'NOTE' | 'TASK' | 'MEETING'>>;
  inlineNoteTag: string;
  setInlineNoteTag: React.Dispatch<React.SetStateAction<string>>;
  isTourNotesCardCollapsed: boolean;
  setIsTourNotesCardCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: (tab: string) => void;
  
  handleUpdateNote: (id: string, updates: any) => void;
  handleDataSubmit: (type: 'note', data: any) => void;
  currentOrNextShow: Show | null;
  shows: Show[];
  activeNoteIndex: number;
  setActiveNoteIndex: React.Dispatch<React.SetStateAction<number>>;
  handleDeleteNote: (id: string) => void;
}

export default function TourNotesCard({
  setIsGlobalHoverPaused = () => {},
  handleNoteTouchStart = () => {},
  handleNoteTouchMove = () => {},
  handleNoteTouchEnd = () => {},
  filteredNotes = [],
  isNoteExpanded = false,
  setIsNoteExpanded = () => {},
  inlineNoteEditingId = null,
  setInlineNoteEditingId = () => {},
  inlineNoteText = '',
  setInlineNoteText = () => {},
  inlineNoteCategory = 'NOTE',
  setInlineNoteCategory = () => {},
  inlineNoteTag = 'GENERAL INFO',
  setInlineNoteTag = () => {},
  isTourNotesCardCollapsed = false,
  setIsTourNotesCardCollapsed = () => {},
  setActiveTab = () => {},
  handleUpdateNote = () => {},
  handleDataSubmit = () => {},
  currentOrNextShow = null,
  shows = [],
  activeNoteIndex = 0,
  setActiveNoteIndex = () => {},
  handleDeleteNote = () => {}
}: Partial<TourNotesCardProps>) {
  return (
    <div className="px-5 py-3">
      <div 
        onMouseEnter={() => setIsGlobalHoverPaused?.(true)}
        onMouseLeave={() => setIsGlobalHoverPaused?.(false)}
        onTouchStart={handleNoteTouchStart}
        onTouchMove={handleNoteTouchMove}
        onTouchEnd={handleNoteTouchEnd}
        className="w-full bg-[#111319] border-2 border-amber-500 rounded-3xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 relative shadow-[0_4px_25px_rgba(245,158,11,0.15)] select-none cursor-grab active:cursor-grabbing"
      >
        {/* Header row */}
        <div className="flex justify-between items-center bg-transparent">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Custom Yellow Folder Icon Container */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-md">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black tracking-widest uppercase font-display text-white">
                  Tour Notes
                </h3>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[8px] font-mono text-emerald-400 font-extrabold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 font-medium mt-0.5 block">
                {(filteredNotes || []).length} {(filteredNotes || []).length === 1 ? 'Note' : 'Notes'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Golden Circle Plus Button */}
            <button 
              onClick={() => { 
                if (!isNoteExpanded || inlineNoteEditingId) {
                    setInlineNoteEditingId?.(null);
                    setInlineNoteText?.('');
                    setInlineNoteCategory?.('NOTE');
                    setInlineNoteTag?.('GENERAL INFO');
                    setIsNoteExpanded?.(true);
                    setIsTourNotesCardCollapsed?.(false);
                } else {
                    setIsNoteExpanded?.(false);
                }
              }}
              className={`${isNoteExpanded && !inlineNoteEditingId ? 'bg-amber-500 rotate-45' : 'bg-[#f9bc15]'} w-8 h-8 sm:w-10 sm:h-10 rounded-full text-black hover:bg-amber-400 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer`}
              title="Add Note"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-black stroke-[3.5]" />
            </button>
            {/* Collapse/Expand entire card */}
            <button 
              onClick={() => setIsTourNotesCardCollapsed?.(!isTourNotesCardCollapsed)}
              className="p-1 sm:p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isTourNotesCardCollapsed ? "Expand Tour Notes" : "Collapse Tour Notes"}
            >
              {isTourNotesCardCollapsed ? (
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              ) : (
                <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              )}
            </button>
            {/* Right Chevron Navigation Button */}
            <button 
              onClick={() => setActiveTab?.('notes')}
              className="p-1 sm:p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="View all notes"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Inline Draft Note Input Box (Expanded state) */}
        <AnimatePresence>
          {!isTourNotesCardCollapsed && isNoteExpanded && (
            <motion.div 
              key="inline-note-form"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0b0c10] border border-zinc-800 rounded-2xl p-3.5 space-y-3 relative z-10">
                <textarea
                  value={inlineNoteText}
                  onChange={(e) => setInlineNoteText?.(e.target.value)}
                  placeholder="Quick note..."
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none min-h-[60px]"
                />
                
                <div className="flex gap-2">
                    <select 
                      value={inlineNoteCategory}
                      onChange={(e) => setInlineNoteCategory?.(e.target.value as 'NOTE' | 'TASK' | 'MEETING')}
                      className="bg-[#111319] border border-zinc-800 text-[8.5px] font-mono font-bold tracking-wider text-amber-500 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/50 flex-1 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;utf8,<svg%20fill=%22%23f59e0b%22%20viewBox=%220%200%2024%2024%22%20xmlns=%22http://www.w3.org/2000/svg%22><path%20d=%22M7%2010l5%205%205-5z%22/></svg>')] bg-[length:14px] bg-[right_8px_center]"
                    >
                        {NOTE_CATEGORIES.map((cat, idx) => <option key={`${cat}-${idx}`} value={cat}>{cat}</option>)}
                    </select>
                    <select 
                      value={inlineNoteTag}
                      onChange={(e) => setInlineNoteTag?.(e.target.value)}
                      className="bg-[#111319] border border-zinc-805 text-[8.5px] font-mono font-bold tracking-wider text-emerald-400 rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500/50 flex-1 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;utf8,<svg%20fill=%22%2310b981%22%20viewBox=%220%200%2024%2024%22%20xmlns=%22http://www.w3.org/2000/svg%22><path%20d=%22M7%2010l5%205%205-5z%22/></svg>')] bg-[length:14px] bg-[right_8px_center]"
                    >
                        {NOTE_STATUSES.map((stat, idx) => <option key={`${stat}-${idx}`} value={stat}>{stat}</option>)}
                    </select>
                </div>

                <div className="flex gap-3 pt-1">
                  <button 
                    onClick={() => setIsNoteExpanded?.(false)}
                    className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800 text-zinc-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (!inlineNoteText.trim()) return;
                      if (inlineNoteEditingId) {
                        handleUpdateNote?.(inlineNoteEditingId, { text: inlineNoteText, category: inlineNoteCategory, tag_name: inlineNoteTag });
                      } else {
                        handleDataSubmit?.('note', { text: inlineNoteText, category: inlineNoteCategory, tag_name: inlineNoteTag, show_id: currentOrNextShow?.id || shows[0]?.id });
                      }
                      setIsNoteExpanded?.(false);
                      setInlineNoteEditingId?.(null);
                      setInlineNoteText?.('');
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors border border-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Note body content with yellow frame aesthetics */}
        {filteredNotes && filteredNotes.length > 0 && activeNoteIndex < filteredNotes.length ? (
          <div className="border border-zinc-800/40 bg-[#0f1116] rounded-2xl p-4.5 space-y-3.5 relative shadow-inner">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-black tracking-widest leading-none">
                {filteredNotes[activeNoteIndex].category}
              </span>
              <span className="text-[8.5px] font-mono text-zinc-500">
                {new Date(filteredNotes[activeNoteIndex].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-[13px] leading-relaxed text-zinc-100 font-sans font-medium">
                {filteredNotes[activeNoteIndex].text}
              </p>
              
              {filteredNotes[activeNoteIndex].show_id && (
                <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-emerald-400 pt-1">
                  <MapPin className="w-3 h-3" />
                  <span>Show: {shows.find(s => s.id === filteredNotes[activeNoteIndex].show_id)?.name || 'Linked Show'}</span>
                </div>
              )}
            </div>

            {/* Tag badge with Color Coding logic */}
            <div className="flex">
              <span className={`text-[8.5px] font-mono font-bold tracking-widest uppercase px-2 py-1 rounded border ${
                filteredNotes[activeNoteIndex].tag_name === 'URGENT' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                filteredNotes[activeNoteIndex].tag_name === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                filteredNotes[activeNoteIndex].tag_name === 'IMPORTANT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                filteredNotes[activeNoteIndex].tag_name === 'LOOK INTO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              }`}>
                {filteredNotes[activeNoteIndex].tag_name || 'NOTE'}
              </span>
            </div>

            {/* Interactive operations buttons row */}
            {!isTourNotesCardCollapsed && (
              <div className="border-t border-zinc-900 pt-3 flex justify-between items-center">
                <button 
                  onClick={() => {
                    setInlineNoteEditingId?.(filteredNotes[activeNoteIndex].id);
                    setInlineNoteText?.(filteredNotes[activeNoteIndex].text || '');
                    setInlineNoteCategory?.((filteredNotes[activeNoteIndex].category as 'NOTE' | 'TASK' | 'MEETING') || 'NOTE');
                    setInlineNoteTag?.(filteredNotes[activeNoteIndex].tag_name || 'GENERAL INFO');
                    setIsNoteExpanded?.(true);
                  }}
                  className="py-1.5 px-3 rounded-md bg-zinc-900 font-mono text-amber-500/90 text-[10px] font-bold tracking-wider hover:bg-zinc-800 border border-zinc-800/40 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Tag className="w-3 h-3 text-amber-500" />
                  Edit Note
                </button>

                <button 
                  onClick={() => handleDeleteNote?.(filteredNotes[activeNoteIndex].id)}
                  className="py-1.5 px-3 rounded-md bg-red-950/20 text-red-400 hover:bg-red-900/30 font-mono text-[10px] font-bold tracking-wider border border-red-900/10 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  title="Delete Note"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}

            {/* Carousel Pagination tracker dots indicators */}
            {!isTourNotesCardCollapsed && (
              <div className="flex justify-center gap-2 pt-2">
                {filteredNotes.map((_, i) => (
                  <button
                    key={`tour-note-card-item-${i}`}
                    onClick={() => setActiveNoteIndex?.(i)}
                    className={`h-2 rounded-full transition-all duration-350 cursor-pointer ${
                      activeNoteIndex === i ? 'w-5 bg-amber-500' : 'w-2 bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-zinc-500 bg-[#0c0e12] rounded-2xl border border-dashed border-zinc-800 font-mono">
            No tour notes setup. Create a note context.
          </div>
        )}

        {/* BOTTOM CAPTION LINK TO OPEN SEPARATE LIST VIEW */}
        {!isTourNotesCardCollapsed && (
          <button
            type="button"
            onClick={() => setActiveTab?.('notes')}
            className="w-full text-center py-1 text-[10px] font-mono text-zinc-550 hover:text-amber-500 transition-colors cursor-pointer inline-block mt-1 font-bold tracking-wider"
          >
            Swipe to browse • Tap to view all {(filteredNotes || []).length} notes
          </button>
        )}
      </div>
    </div>
  );
}
