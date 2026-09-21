import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, MoreVertical, User, DollarSign, Search, Palette,
  Image as ImageIcon, Pin as PinIcon, BellOff, Volume2, Download,
  Share2, Clock, Eye, MessageSquare, Shield, Lock, MinusCircle,
  Slash, AlertTriangle, Trash2, Send, X, Users, Check
} from 'lucide-react';

export interface DirectMessageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChatId: string | null;
  setSelectedChatId?: (id: string | null) => void;
  chats: any[];
  setChats: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedUserProfile?: (user: any) => void;
  getProfileForUser?: (opts: { name?: string; avatar?: string; role?: string }) => any;
  triggerNotification?: (msg: string) => void;
  setShowReportModal?: (show: boolean) => void;
  setReportReason?: (reason: string) => void;
  onSendMessage?: (chatId: string, text: string) => void;
}

export const DirectMessageDrawer: React.FC<DirectMessageDrawerProps> = ({
  isOpen,
  onClose,
  selectedChatId,
  setSelectedChatId,
  chats,
  setChats,
  setSelectedUserProfile,
  getProfileForUser,
  triggerNotification,
  setShowReportModal,
  setReportReason,
  onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, activeTab, selectedChatId]);

  const activeChat = selectedChatId ? chats.find(c => c.id === selectedChatId || c.id?.toLowerCase() === selectedChatId.toLowerCase()) : null;

  const handleSend = (e: React.FormEvent) => {
    if (!activeChat) return;
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    if (onSendMessage) {
      onSendMessage(activeChat.id, text);
    } else {
      setChats(prev => prev.map(c => {
        if (c.id === activeChat.id) {
          const newMsgs = c.messages ? [...c.messages] : [];
          newMsgs.push({
            id: `msg_${Date.now()}`,
            sender: 'user',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawTime: Date.now()
          });
          return { ...c, messages: newMsgs, lastMessage: text, time: 'Just now' };
        }
        return c;
      }));
    }
  };

  const handleViewProfile = () => {
    onClose();
    if (setSelectedUserProfile && getProfileForUser) {
      setSelectedUserProfile(getProfileForUser({
        name: activeChat.name,
        avatar: activeChat.avatar,
        role: activeChat.role
      }));
    }
  };

  const filteredMessages = (activeChat?.messages || []).filter((m: any) => {
    if (!searchQuery.trim()) return true;
    return (m.text || m.message || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AnimatePresence>
      {isOpen && selectedChatId && activeChat && (
        <motion.div
          key="direct-message-drawer"
          initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-full bg-black z-[100] flex flex-col shadow-2xl border-l border-zinc-900"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-black/90 backdrop-blur-md border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-2 text-zinc-300 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
              title="Close Drawer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleViewProfile}>
              <img
                src={activeChat?.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'}
                className="w-9 h-9 rounded-full object-cover border border-zinc-800 shrink-0"
                alt={activeChat?.name}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate leading-tight">{activeChat?.name}</span>
                <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeChat?.online !== false ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                  {activeChat?.role || 'Direct Message'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab(activeTab === 'settings' ? 'chat' : 'settings')}
              className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              title={activeTab === 'settings' ? 'View Messages' : 'Conversation Settings'}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'chat' ? (
          <div className="flex flex-col flex-1 h-full min-h-0 bg-zinc-950/60 overflow-hidden">
            {/* Search Bar Toggle */}
            {showSearch && (
              <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2 shrink-0">
                <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in conversation..."
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-zinc-500 font-mono"
                  autoFocus
                />
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                  className="text-zinc-400 hover:text-white text-xs font-mono"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Message History Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-cyan-500" />
                  <p className="text-xs font-mono">No messages in this conversation yet.</p>
                  <p className="text-[11px] text-zinc-600 mt-1">Send a direct message below to start the signal.</p>
                </div>
              ) : (
                filteredMessages.map((msg: any, idx: number) => {
                  const isMe = msg.sender === 'user' || msg.sender_id === 'user';
                  return (
                    <div key={msg.id ? `msg-${msg.id}-${idx}` : `msg-${idx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-red-900 to-red-950 text-red-100 border border-red-800/40 rounded-br-none'
                          : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                      }`}>
                        <div className="break-words leading-relaxed">{msg.text || msg.message}</div>
                        <div className={`text-[9px] font-mono mt-1 text-right ${isMe ? 'text-red-300/60' : 'text-zinc-500'}`}>
                          {msg.time || 'Just now'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Bottom Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-black border-t border-zinc-900 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeChat.name}...`}
                className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 font-mono transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-8">
            {/* Profile Info Header */}
            <div className="flex flex-col items-center pt-4 pb-6 border-b border-zinc-900/80">
              <img
                src={activeChat?.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'}
                className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-zinc-800 shadow-xl"
                alt={activeChat?.name}
              />
              <h2 className="text-2xl font-bold text-white mb-5 tracking-tight">{activeChat?.name}</h2>

              {/* Action Buttons Row */}
              <div className="flex justify-center gap-5 w-full px-4">
                <div onClick={handleViewProfile} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-red-500/50 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">Profile</span>
                </div>

                <div onClick={() => triggerNotification?.("Payments opened")} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all shadow-md">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">Payments</span>
                </div>

                <div onClick={() => { setActiveTab('chat'); setShowSearch(true); }} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-cyan-500/50 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all shadow-md">
                    <Search className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">Search</span>
                </div>

                <div onClick={() => triggerNotification?.("Customize theme opened")} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-purple-500/50 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all shadow-md">
                    <Palette className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">Theme</span>
                </div>
              </div>
            </div>

            {/* Chat Info & Media */}
            <div className="px-4 py-3">
              <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-3">Chat Info & Media</h3>
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden border border-zinc-800/80">
                  <div className="aspect-[4/3] bg-zinc-800">
                    <img src="https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=500" className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="grid grid-rows-2 gap-1.5 h-full">
                    <img src="https://images.unsplash.com/photo-1571266028243-cb40fce75739?w=500" className="w-full h-full object-cover" alt="" />
                    <div className="grid grid-cols-2 gap-1.5 h-full">
                      <img src="https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=500" className="w-full h-full object-cover" alt="" />
                      <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500" className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 divide-y divide-zinc-900 border-b border-zinc-900 pb-2">
                <button onClick={() => triggerNotification?.("Media viewer opened")} className="w-full flex items-center gap-3.5 py-2.5 text-left group">
                  <ImageIcon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">View all media, files & links</span>
                </button>
                <button onClick={() => triggerNotification?.("Pinned messages opened")} className="w-full flex items-center gap-3.5 py-2.5 text-left group">
                  <PinIcon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Pinned messages</span>
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-2">Options</h3>
              <div className="space-y-1 divide-y divide-zinc-900 border-b border-zinc-900 pb-2">
                <button
                  onClick={() => setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, settings: { ...c.settings, muted: !c.settings?.muted } } : c))}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <BellOff className={`w-5 h-5 transition-colors shrink-0 ${activeChat.settings?.muted ? 'text-rose-400' : 'text-zinc-400 group-hover:text-white'}`} />
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {activeChat.settings?.muted ? 'Unmute notifications' : 'Mute notifications'}
                  </span>
                </button>

                <button
                  onClick={() => setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, settings: { ...c.settings, notifications: !(c.settings?.notifications ?? true) } } : c))}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <Volume2 className={`w-5 h-5 transition-colors shrink-0 ${!(activeChat.settings?.notifications ?? true) ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-white'}`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Sound notifications</span>
                    <span className="text-[11px] text-zinc-500 font-mono">{activeChat.settings?.notifications !== false ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </button>

                <button
                  onClick={() => setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, settings: { ...c.settings, autoSavePhotos: !c.settings?.autoSavePhotos } } : c))}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <Download className={`w-5 h-5 transition-colors shrink-0 ${activeChat.settings?.autoSavePhotos ? 'text-cyan-400' : 'text-zinc-400 group-hover:text-white'}`} />
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Auto-save photos</span>
                </button>

                <button
                  onClick={() => triggerNotification?.("Contact shared")}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <Share2 className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Share contact</span>
                </button>
              </div>
            </div>

            {/* Privacy & Support */}
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-2">Privacy & Support</h3>
              <div className="space-y-1 divide-y divide-zinc-900">
                <button
                  onClick={() => setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, settings: { ...c.settings, disappearing: c.settings?.disappearing === '24 hours' ? '7 days' : c.settings?.disappearing === '7 days' ? 'Off' : '24 hours' } } : c))}
                  className="w-full flex items-center justify-between py-2.5 text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <Clock className={`w-5 h-5 transition-colors shrink-0 ${activeChat.settings?.disappearing && activeChat.settings.disappearing !== 'Off' ? 'text-rose-400' : 'text-zinc-400 group-hover:text-white'}`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Disappearing messages</span>
                      <span className="text-[11px] text-zinc-500 font-mono">{activeChat.settings?.disappearing || 'Off'}</span>
                    </div>
                  </div>
                  <span className="bg-red-950 text-red-400 border border-red-900/50 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">ENCRYPTED</span>
                </button>

                <button
                  onClick={() => setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, settings: { ...c.settings, readReceipts: !(c.settings?.readReceipts ?? true) } } : c))}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <Eye className={`w-5 h-5 transition-colors shrink-0 ${!(activeChat.settings?.readReceipts ?? true) ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-white'}`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Read receipts</span>
                    <span className="text-[11px] text-zinc-500 font-mono">{activeChat.settings?.readReceipts !== false ? 'On' : 'Off'}</span>
                  </div>
                </button>

                <button
                  onClick={() => setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, settings: { ...c.settings, typingIndicator: !(c.settings?.typingIndicator ?? true) } } : c))}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <MessageSquare className={`w-5 h-5 transition-colors shrink-0 ${!(activeChat.settings?.typingIndicator ?? true) ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-white'}`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Typing indicator</span>
                    <span className="text-[11px] text-zinc-500 font-mono">{activeChat.settings?.typingIndicator !== false ? 'On' : 'Off'}</span>
                  </div>
                </button>

                <button
                  onClick={() => triggerNotification?.("Message permissions toggled")}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <Shield className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Message permissions</span>
                </button>

                <button
                  onClick={() => triggerNotification?.("End-to-end encryption details")}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <Lock className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">End-to-end encryption</span>
                    <span className="text-[11px] text-zinc-500 font-mono">Protected by Nexus Protocol</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, settings: { ...c.settings, blocked: !c.settings?.blocked } } : c));
                    triggerNotification?.(activeChat.settings?.blocked ? `Unblocked ${activeChat?.name}` : `Blocked ${activeChat?.name}`);
                  }}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <MinusCircle className={`w-5 h-5 transition-colors shrink-0 ${activeChat.settings?.blocked ? 'text-red-500' : 'text-zinc-400 group-hover:text-white'}`} />
                  <span className={`text-sm font-medium transition-colors ${activeChat.settings?.blocked ? 'text-red-400' : 'text-zinc-200 group-hover:text-white'}`}>
                    {activeChat.settings?.blocked ? 'Unblock user' : 'Block user'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, settings: { ...c.settings, restricted: !c.settings?.restricted } } : c));
                    triggerNotification?.(activeChat.settings?.restricted ? `Unrestricted ${activeChat?.name}` : `Restricted ${activeChat?.name}`);
                  }}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <Slash className={`w-5 h-5 transition-colors shrink-0 ${activeChat.settings?.restricted ? 'text-orange-500' : 'text-zinc-400 group-hover:text-white'}`} />
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {activeChat.settings?.restricted ? 'Unrestrict account' : 'Restrict account'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (setShowReportModal) setShowReportModal(true);
                    if (setReportReason) setReportReason('');
                  }}
                  className="w-full flex items-center gap-3.5 py-2.5 text-left group"
                >
                  <AlertTriangle className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Report conversation</span>
                    <span className="text-[11px] text-zinc-500 font-mono">Give feedback or report safety issues</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setChats(prev => prev.filter(c => c.id !== activeChat.id));
                    onClose();
                    if (setSelectedChatId) setSelectedChatId(null);
                    triggerNotification?.(`Chat with ${activeChat?.name} deleted`);
                  }}
                  className="w-full flex items-center gap-3.5 py-3 text-left group mt-2"
                >
                  <Trash2 className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors shrink-0" />
                  <span className="text-sm font-medium text-red-500 group-hover:text-red-400 transition-colors">Delete chat</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DirectMessageDrawer;
