import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Music2, MapPin, Sparkles, Building2, User } from 'lucide-react';
import { searchMentionSuggestions, MentionSuggestionItem } from '../../../services/mentionSearchService';

export interface CommentMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface CommentMentionInputRef {
  focus: () => void;
}

export const CommentMentionInput = forwardRef<CommentMentionInputRef, CommentMentionInputProps>(({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write a comment... (use @ to tag)',
  className = '',
  disabled = false,
  autoFocus = false,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MentionSuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  // Close mention popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMentionQuery(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search when mentionQuery changes
  useEffect(() => {
    if (mentionQuery === null) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    searchMentionSuggestions(mentionQuery).then((items) => {
      if (!isMounted) return;
      setSuggestions(items);
      setSelectedIndex(0);
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) {
        setSuggestions([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    const cursorPos = e.target.selectionStart || newVal.length;
    const textBeforeCursor = newVal.slice(0, cursorPos);

    // Look for active @mention at the cursor position
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\-\s]{0,25})$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const selectSuggestion = (item: MentionSuggestionItem) => {
    const input = inputRef.current;
    const cursorPos = input?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);

    // Strip the typed @query before cursor
    const textBeforeMatch = textBeforeCursor.replace(/@([a-zA-Z0-9_\-\s]{0,25})$/, '');
    const tagText = `@${item.name} `;
    const updated = textBeforeMatch + tagText + textAfterCursor;

    onChange(updated);
    setMentionQuery(null);
    setSuggestions([]);

    setTimeout(() => {
      if (input) {
        input.focus();
        const newPos = textBeforeMatch.length + tagText.length;
        input.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const getTagIcon = (tagType: string) => {
    switch (tagType) {
      case 'band':
        return <Music2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'promoter':
      case 'venue':
        return <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'creative':
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'label':
        return <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <User className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 flex items-center min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={className}
      />

      {/* Floating Mention Autocomplete Popover (Positioned above input) */}
      {mentionQuery !== null && (
        <div 
          className="absolute bottom-full mb-2 left-0 z-50 w-72 sm:w-80 max-h-64 overflow-y-auto bg-[#101218] border border-zinc-700/90 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] divide-y divide-zinc-800/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 select-none"
        >
          {/* Header */}
          <div className="px-3 py-1.5 bg-black/60 text-[9.5px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Tag in Comment
            </span>
            <span className="text-[8.5px] text-zinc-500 font-mono">↑↓ Enter</span>
          </div>

          {/* Suggestions List */}
          {isLoading && suggestions.length === 0 ? (
            <div className="p-3 text-center text-xs text-zinc-500 font-mono">
              Searching scene profiles...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col p-1 gap-0.5">
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`mention-opt-${item.id}-${idx}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left w-full transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 text-white shadow-sm ring-1 ring-emerald-500/30'
                        : 'hover:bg-zinc-850/60 text-zinc-300'
                    }`}
                  >
                    {/* Avatar / Monogram */}
                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700/80 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Name & Subtitle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-zinc-100 truncate">
                          {item.name}
                        </span>
                        {getTagIcon(item.tagType)}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-normal">
                        {item.subtitle}
                      </p>
                    </div>

                    <span className="text-[10.5px] font-mono font-bold text-emerald-400 shrink-0">
                      @{item.handle}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-zinc-500 font-mono">
              {mentionQuery ? `No matches found for "@${mentionQuery}"` : 'Type a name or band...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CommentMentionInput.displayName = 'CommentMentionInput';
