import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Trash2, ArrowLeft, Send } from 'lucide-react';

interface LabelInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  inboxSubTab: 'conversations' | 'chat';
  setInboxSubTab: (tab: 'conversations' | 'chat') => void;
  activeInboxChatId: string | null;
  setActiveInboxChatId: (id: string | null) => void;
  inboxChannels: any[];
  setInboxChannels: React.Dispatch<React.SetStateAction<any[]>>;
  inboxMessages: Record<string, any[]>;
  inboxReplyDraft: string;
  setInboxReplyDraft: (val: string) => void;
  handleSendInboxReply: (suggestedText?: string) => void;
  getThreadMessages: () => any[];
  showLocalToast: (msg: string) => void;
}

export const LabelInboxDrawer: React.FC<LabelInboxDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  inboxSubTab,
  setInboxSubTab,
  activeInboxChatId,
  setActiveInboxChatId,
  inboxChannels,
  setInboxChannels,
  inboxMessages,
  inboxReplyDraft,
  setInboxReplyDraft,
  handleSendInboxReply,
  getThreadMessages,
  showLocalToast
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col pt-safe text-zinc-100"
        >
          {/* Header section with clean human-centric text */}
          <div className="border-b border-zinc-900 bg-[#07080a] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-[#f97316]/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#f97316]" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono text-white tracking-widest uppercase flex items-center gap-2">
                  Label Message Center
                </h2>
                <p className="text-[10px] text-zinc-500 uppercase mt-0.5 font-mono">
                  Direct discussions and booking inquiries with signed bands & coordinators
                </p>
              </div>
            </div>

            {/* Status metrics bar */}
            <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-zinc-400 bg-zinc-950/60 px-4 py-2 border border-zinc-900 w-full sm:w-auto rounded-xl">
              <div>
                LOGGED IN AS: <span className="text-[#f97316] font-bold">{(userProfile.label_company_name || 'NEXUS LABEL HQ').toUpperCase()}</span>
              </div>
              <div className="hidden sm:block text-zinc-800">|</div>
              <div>
                SYSTEM INTEGRITY: <span className="text-emerald-400 font-bold">SECURE</span>
              </div>
              <div className="hidden sm:block text-zinc-800">|</div>
              <button
                type="button"
                onClick={onClose}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-350 font-bold px-3 py-1 rounded text-[10px] uppercase tracking-wider transition-all hover:bg-zinc-800 w-full sm:w-auto hover:text-white active:scale-95 cursor-pointer flex items-center gap-1.5 justify-center"
              >
                <X className="w-3.5 h-3.5 text-zinc-400" />
                <span>CLOSE INBOX</span>
              </button>
            </div>
          </div>

          {/* Sub-tab navigation bar */}
          <div className="border-b border-zinc-900 bg-[#07080a] flex items-center p-2.5 gap-2 select-none">
            <button
              type="button"
              onClick={() => setInboxSubTab('conversations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all font-mono uppercase cursor-pointer ${
                inboxSubTab === 'conversations'
                  ? 'bg-orange-600/25 border border-[#f97316]/40 text-orange-300'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              1. Channels ({inboxChannels.length})
            </button>
            <button
              type="button"
              onClick={() => setInboxSubTab('chat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all font-mono uppercase cursor-pointer ${
                inboxSubTab === 'chat'
                  ? 'bg-orange-600/25 border border-[#f97316]/40 text-orange-300'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              2. Active Chat Stream
            </button>
          </div>

          {/* Split Workspace Dynamic View */}
          <div className="flex-1 overflow-hidden w-full h-full bg-[#07080a] flex flex-col">
            {inboxSubTab === 'conversations' ? (
              /* Tab 1: List of Band Chats */
              <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
                <div className="pb-2 border-b border-zinc-900">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                    Active Communication Channels
                  </span>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1">
                    Choose any incoming thread or active band support line below to open live communications.
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  {inboxChannels.map((channel, idx) => {
                    const isCurrentlyActive = activeInboxChatId === channel.id;
                    const threadMsgs = inboxMessages[channel.id] || [];
                    const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
                    const snippet = lastMsg ? lastMsg.text : "Connecting to line...";
                    
                    return (
                      <div
                        key={`${channel.id}-${idx}`}
                        className={`w-full relative transition-all rounded-2xl border group ${
                          isCurrentlyActive 
                            ? 'bg-zinc-900/40 border-[#f97316]/40 text-white shadow-md shadow-orange-950/5' 
                            : 'bg-zinc-950/30 hover:bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setInboxChannels(prev => prev.filter(c => c.id !== channel.id));
                            if (activeInboxChatId === channel.id) setActiveInboxChatId(null);
                            showLocalToast('Conversation Deleted');
                          }}
                          className="absolute right-3 top-3 p-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer"
                          title="Delete Conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInboxChatId(channel.id);
                            setInboxSubTab('chat');
                          }}
                          className="w-full p-4 text-left flex items-start gap-4 cursor-pointer"
                        >
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono text-xs font-black shrink-0 ${channel.badgeColor}`}>
                            {channel.avatarText}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-mono text-xs font-black truncate block uppercase text-white">
                                {channel.name}
                              </span>
                            </div>
                            <span className="text-[8.5px] text-zinc-500 font-mono uppercase block mt-1">
                              {channel.category}
                            </span>
                            <p className="text-xs text-zinc-400 font-mono truncate block mt-2.5 leading-relaxed">
                              {lastMsg?.sender === 'label' ? 'You: ' : ''}{snippet}
                            </p>
                          </div>
                          
                          {isCurrentlyActive && (
                            <div className="absolute right-10 top-4.5 w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Tab 2: Message Stream Detail */
              <div className="flex-1 flex flex-col h-full bg-[#07080a] overflow-hidden relative">
                {/* Selected channel info bar */}
                {(() => {
                  const activeChanObj = inboxChannels.find(c => c.id === activeInboxChatId);
                  if (!activeChanObj) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/30">
                        <MessageSquare className="w-12 h-12 text-zinc-800 mb-3" />
                        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider block">No channel selected</span>
                        <button
                          type="button"
                          onClick={() => setInboxSubTab('conversations')}
                          className="mt-4 bg-[#f97316] hover:bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Browse Conversations
                        </button>
                      </div>
                    );
                  }
                  
                  const textStream = getThreadMessages();

                  return (
                    <>
                      <div className="p-4 bg-zinc-950/70 border-b border-zinc-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setInboxSubTab('conversations')}
                            className="mr-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 p-2 rounded-xl text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer uppercase font-black"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 text-[#f97316]" />
                            <span>Channel List</span>
                          </button>
                          <div>
                            <h4 className="text-xs font-black font-mono text-white uppercase tracking-wider">
                              {activeChanObj.name}
                            </h4>
                            <span className="text-[9px] text-zinc-400 font-mono uppercase block mt-0.5">
                              {activeChanObj.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-500/30 px-3 py-1 rounded-lg text-[9px] font-mono text-emerald-400 shrink-0 uppercase font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LINE OPEN
                        </div>
                      </div>

                      {/* Interactive quick reply proposals */}
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex flex-wrap gap-2 items-center select-none">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mr-1">QUICK REPLIES:</span>
                        {activeInboxChatId === 'tomb-mold-rep' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("I checked with the printing plant! The vinyl shipments are finalized to hit your first three show venues by Friday morning.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ LP Delivery Confirmed ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Excellent. Staging files are approved. Let's arrange our freight carrier coordinates tonight.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Approve Stage Logistics ]
                            </button>
                          </>
                        )}
                        {activeInboxChatId === 'blood-incantation-manager' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Confirmed our cover feature schedule with Decibel! The official print cutoff is tomorrow at 5 PM. Sending final materials now.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Decibel Cutoff confirmed ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Our master audio stems are fully validated and packed into the secure core Vault. Let's schedule the Campaign call.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Schedule Campaign Call ]
                            </button>
                          </>
                        )}
                        {activeInboxChatId === 'nexus-pr-coordinator' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Sleeve graphics and full master audio loops have been uploaded and encrypted. Please check the press directory.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Upload completed ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Decibel print draft page is approved. Premier schedule is locked. Thanks for coordinating.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-[#fff] rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Approve print layouts ]
                            </button>
                          </>
                        )}
                      </div>

                      {/* Message stream */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-end bg-black/40">
                        <div className="space-y-4 max-w-3xl mx-auto w-full">
                          {textStream.map((msg: any, idx) => {
                            const isMe = msg.sender === 'label';
                            return (
                              <div
                                key={`${msg.id}-${idx}`}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
                                    {isMe ? 'LABEL MANAGER (YOU)' : activeChanObj.name}
                                  </span>
                                  <span className="text-[9px] font-mono text-zinc-600">•</span>
                                  <span className="text-[8.5px] font-mono text-zinc-500">{msg.timestamp}</span>
                                </div>
                                <div className={`p-4 rounded-2xl max-w-lg font-mono text-xs leading-relaxed border ${
                                  isMe 
                                    ? 'bg-orange-950/20 border-[#f97316]/30 text-zinc-150 rounded-tr-none' 
                                    : 'bg-zinc-950/80 border-zinc-900 text-zinc-300 rounded-tl-none'
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Message input controls */}
                      <div className="p-4 bg-zinc-950/80 border-t border-zinc-900">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendInboxReply();
                          }}
                          className="max-w-3xl mx-auto flex items-center gap-3"
                        >
                          <input
                            type="text"
                            value={inboxReplyDraft}
                            onChange={(e) => setInboxReplyDraft(e.target.value)}
                            placeholder={`Type response to ${activeChanObj.name}...`}
                            className="flex-1 bg-[#090b0e] border border-zinc-800 hover:border-zinc-700/60 focus:border-[#f97316] rounded-xl px-4 py-3 text-xs font-mono text-zinc-100 placeholder-zinc-505 focus:outline-none transition-all"
                          />
                          <button
                            type="submit"
                            className="bg-[#f97316] hover:bg-orange-500 text-black font-black font-mono text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5 text-black" />
                            <span>SEND</span>
                          </button>
                        </form>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
