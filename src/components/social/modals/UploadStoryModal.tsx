import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase as getGlobalSupabase } from '../../../supabase';
import { base64ToBlob, uploadStoryMediaToStorage } from '../../../services/storageService';
import { publishStoryAuthoritative, StoryItem } from '../utils/storiesPersistenceService';
import {
  Sparkles,
  X,
  Type,
  Music,
  Sticker,
  Palette,
  Upload,
  Film,
  Music2,
  Trash2,
  Play,
  Pause,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Image as ImageIcon,
  Check,
  Tag,
  Smile,
  HelpCircle,
  Clock,
  Link,
  Sliders,
  Maximize2
} from 'lucide-react';

interface UploadStoryModalProps {
  showUploadStoryModal: boolean;
  setShowUploadStoryModal: (val: boolean) => void;
  newStoryImage: string;
  setNewStoryImage: (val: string) => void;
  newStoryVideo: string;
  setNewStoryVideo: (val: string) => void;
  newStoryMusic: string;
  setNewStoryMusic: (val: string) => void;
  newStoryCaption: string;
  setNewStoryCaption: (val: string) => void;
  newStoryTextOverlay: string;
  setNewStoryTextOverlay: (val: string) => void;
  newStoryTextStyle: string;
  setNewStoryTextStyle: (val: string) => void;
  newStoryTextColorHex: string;
  setNewStoryTextColorHex: (val: string) => void;
  newStoryTextSize: number;
  setNewStoryTextSize: (val: number) => void;
  newStoryTextX: number;
  setNewStoryTextX: (val: number) => void;
  newStoryTextY: number;
  setNewStoryTextY: (val: number) => void;
  newStoryBorder: string;
  setNewStoryBorder: (val: string) => void;
  newStoryStickers: any[];
  setNewStoryStickers: React.Dispatch<React.SetStateAction<any[]>>;
  selectedStorySticker: string;
  setSelectedStorySticker: (val: string) => void;
  newStoryStickerScale: number;
  setNewStoryStickerScale: (val: number) => void;
  newStoryStickerX: number;
  setNewStoryStickerX: (val: number) => void;
  newStoryStickerY: number;
  setNewStoryStickerY: (val: number) => void;
  setStories: React.Dispatch<React.SetStateAction<any[]>>;
  userProfile?: any;
  triggerNotification?: (msg: string) => void;
  getSupabase?: () => any;
}

export const UploadStoryModal: React.FC<UploadStoryModalProps> = ({
  showUploadStoryModal,
  setShowUploadStoryModal,
  newStoryImage,
  setNewStoryImage,
  newStoryVideo,
  setNewStoryVideo,
  newStoryMusic,
  setNewStoryMusic,
  newStoryCaption,
  setNewStoryCaption,
  newStoryTextOverlay,
  setNewStoryTextOverlay,
  newStoryTextStyle,
  setNewStoryTextStyle,
  newStoryTextColorHex,
  setNewStoryTextColorHex,
  newStoryTextSize,
  setNewStoryTextSize,
  newStoryTextX,
  setNewStoryTextX,
  newStoryTextY,
  setNewStoryTextY,
  newStoryBorder,
  setNewStoryBorder,
  newStoryStickers,
  setNewStoryStickers,
  selectedStorySticker,
  setSelectedStorySticker,
  newStoryStickerScale,
  setNewStoryStickerScale,
  newStoryStickerX,
  setNewStoryStickerX,
  newStoryStickerY,
  setNewStoryStickerY,
  setStories,
  userProfile,
  triggerNotification,
  getSupabase
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [storySubTab, setStorySubTab] = useState<'text' | 'music' | 'stickers' | 'interactive' | 'effects' | 'border' | 'preset'>('text');
  const [presetBg, setPresetBg] = useState<string>('from-rose-950/60 via-zinc-950 to-purple-950/60');
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  // Facebook Story Creator enhancements: Interactive features & effects
  const [storyFilter, setStoryFilter] = useState<'normal' | 'vhs' | 'grunge' | 'noir' | 'toxic' | 'hyper'>('normal');
  const [tagBandPerson, setTagBandPerson] = useState<string>('');
  const [feelingMood, setFeelingMood] = useState<string>('');
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOption1, setPollOption1] = useState<string>('🔥 Hell Yeah');
  const [pollOption2, setPollOption2] = useState<string>('💀 Hard Pass');
  const [externalLink, setExternalLink] = useState<string>('');
  const [showTimestampBadge, setShowTimestampBadge] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!showUploadStoryModal) return null;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (storySubTab === 'stickers') {
      setNewStoryStickerX(xPct);
      setNewStoryStickerY(yPct);
    } else {
      setNewStoryTextX(xPct);
      setNewStoryTextY(yPct);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedMediaFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (file.type.startsWith('video/')) {
        setNewStoryVideo(result);
        setNewStoryImage('');
      } else {
        setNewStoryImage(result);
        setNewStoryVideo('');
      }
      triggerNotification?.(`Attached media: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handlePostStory = async () => {
    if (!newStoryImage && !newStoryVideo && !newStoryTextOverlay && !pollQuestion && !feelingMood) {
      triggerNotification?.("Please add media, text overlay, mood, or interactive poll to post your story.");
      return;
    }

    setIsUploading(true);
    setUploadStatusMsg('Publishing story app-wide...');
    try {
      const authorDisplayName = userProfile?.username || userProfile?.name || userProfile?.full_name || 'Anonymous';
      const initialMediaUrl = newStoryVideo || newStoryImage || '';
      const isVideo = !!newStoryVideo || (selectedMediaFile && selectedMediaFile.type.startsWith('video/'));

      const rawStoryItem: StoryItem = {
        id: `story_${Date.now()}`,
        name: authorDisplayName,
        user: authorDisplayName,
        username: authorDisplayName,
        avatar: userProfile?.avatar_url || userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        media_url: initialMediaUrl,
        mediaUrl: initialMediaUrl,
        image: isVideo ? null : initialMediaUrl,
        video: isVideo ? initialMediaUrl : null,
        caption: newStoryCaption || null,
        music: newStoryMusic || null,
        textOverlay: newStoryTextOverlay || null,
        textoverlay: newStoryTextOverlay || null,
        textStyle: newStoryTextStyle,
        textstyle: newStoryTextStyle,
        textColorHex: newStoryTextColorHex,
        textcolorhex: newStoryTextColorHex,
        textSize: newStoryTextSize,
        textsize: newStoryTextSize,
        textX: newStoryTextX,
        textx: newStoryTextX,
        textY: newStoryTextY,
        texty: newStoryTextY,
        border: newStoryBorder,
        stickers: newStoryStickers,
        stickerScale: newStoryStickerScale,
        stickerscale: newStoryStickerScale,
        stickerX: newStoryStickerX,
        stickerx: newStoryStickerX,
        stickerY: newStoryStickerY,
        stickery: newStoryStickerY,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        profile_id: userProfile?.id || undefined,
        // Enhanced Facebook-style interactive metadata
        interactiveData: {
          tag: tagBandPerson || undefined,
          feeling: feelingMood || undefined,
          filter: storyFilter !== 'normal' ? storyFilter : undefined,
          link: externalLink || undefined,
          showTimestamp: showTimestampBadge,
          poll: pollQuestion ? {
            question: pollQuestion,
            option1: pollOption1 || 'Yes',
            option2: pollOption2 || 'No'
          } : undefined
        } as any
      };

      // Publish to cloud storage, backend API, Supabase table, and local store
      const publishedStory = await publishStoryAuthoritative(rawStoryItem, selectedMediaFile, userProfile);

      setStories((prev) => [publishedStory, ...prev.filter((s) => s.id !== publishedStory.id)]);
      setSelectedMediaFile(null);

      // Broadcast to any other components/hooks listening in this session
      window.dispatchEvent(new CustomEvent('nexus_story_published', { detail: publishedStory }));

      // Reset fields
      setNewStoryImage('');
      setNewStoryVideo('');
      setNewStoryCaption('');
      setNewStoryMusic('');
      setNewStoryTextOverlay('');
      setNewStoryStickers([]);
      setNewStoryTextSize(16);
      setNewStoryTextX(50);
      setNewStoryTextY(50);
      setNewStoryStickerScale(1.0);
      setNewStoryStickerX(50);
      setNewStoryStickerY(30);
      setTagBandPerson('');
      setFeelingMood('');
      setPollQuestion('');
      setExternalLink('');
      setStoryFilter('normal');
      setShowUploadStoryModal(false);
      triggerNotification?.("Story published app-wide to the Scene Pit!");
    } catch (err) {
      console.error("Failed to post story:", err);
      triggerNotification?.("Failed to post story. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadStatusMsg('');
    }
  };

  return (
    <AnimatePresence>
      {showUploadStoryModal && (
        <motion.div
          key="modal-backdrop-uploadstorymodal-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100005] flex items-center justify-center p-2 sm:p-4 pb-16 sm:pb-6 overflow-y-auto custom-scrollbar"
        >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-[#0e0e11] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[88vh] sm:max-h-[90vh] shadow-[0_0_60px_rgba(244,63,94,0.18)] flex flex-col overflow-hidden my-auto"
        >
          {/* Top Title Bar (Fixed header, never scrolls away) */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-900 bg-zinc-950 flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-widest font-display">
                  ENHANCED STORY OVERLAY STUDIO
                </h3>
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                  Interactive Positioning • Custom Audio & Aura Preset Effects
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowUploadStoryModal(false);
                setNewStoryImage('');
                setNewStoryVideo('');
                setNewStoryCaption('');
                setNewStoryMusic('');
                setNewStoryTextOverlay('');
                setNewStoryStickers([]);
                setTagBandPerson('');
                setFeelingMood('');
                setPollQuestion('');
                setExternalLink('');
                setStoryFilter('normal');
              }}
              className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas & Studio Options Split (Scrollable Content Area) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {/* Visual Canvas Preview (5 cols) */}
            <div className="md:col-span-5 bg-black/90 p-4 sm:p-5 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col items-center justify-center relative flex-shrink-0 md:sticky md:top-0">
              <p className="text-[9px] font-mono text-zinc-400 uppercase mb-2 flex items-center gap-1">
                <Move className="w-3 h-3 text-rose-500" /> Click canvas to set {storySubTab === 'stickers' ? 'Sticker' : 'Text'} position
              </p>
              <div
                onClick={handleCanvasClick}
                className={`relative w-full max-w-[210px] sm:max-w-[240px] aspect-[9/16] rounded-2xl overflow-hidden border-2 shadow-2xl flex flex-col justify-between p-3 sm:p-4 cursor-crosshair transition-all ${newStoryBorder}`}
              >
                {/* Visual Camera / Aesthetic FX Filter Container */}
                <div className={`absolute inset-0 z-0 pointer-events-none ${
                  storyFilter === 'vhs'
                    ? 'contrast-125 saturate-150 hue-rotate-15'
                    : storyFilter === 'grunge'
                    ? 'sepia contrast-150 brightness-90'
                    : storyFilter === 'noir'
                    ? 'grayscale contrast-150 brightness-95'
                    : storyFilter === 'toxic'
                    ? 'hue-rotate-90 saturate-200 contrast-125'
                    : storyFilter === 'hyper'
                    ? 'saturate-200 contrast-150 brightness-110'
                    : ''
                }`}>
                  {/* Background Image / Video / Gradient Preset */}
                  {newStoryImage ? (
                    <img src={newStoryImage} alt="" className="w-full h-full object-cover" />
                  ) : newStoryVideo ? (
                    <video src={newStoryVideo} autoPlay loop muted className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-b ${presetBg} flex items-center justify-center p-4 text-center`}>
                      <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest pointer-events-none">CANVAS PREVIEW</p>
                    </div>
                  )}
                </div>

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-1 pointer-events-none" />

                {/* Top Interactive Badges (Tag, Mood, Timestamp) */}
                <div className="relative z-10 flex flex-col gap-1.5 w-full pointer-events-none">
                  <div className="flex items-center justify-between gap-1">
                    {showTimestampBadge && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[8px] font-mono text-zinc-300 font-bold">
                        <Clock className="w-2.5 h-2.5 text-rose-400" />
                        <span>NOW</span>
                      </div>
                    )}
                    {feelingMood && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 backdrop-blur border border-rose-500/40 text-[8px] font-mono text-rose-300 font-bold ml-auto">
                        <Smile className="w-2.5 h-2.5 text-rose-400" />
                        <span className="truncate max-w-[100px]">{feelingMood}</span>
                      </div>
                    )}
                  </div>
                  {tagBandPerson && (
                    <div className="self-start flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/80 backdrop-blur border border-blue-500/40 text-[8px] font-mono text-blue-300 font-bold">
                      <Tag className="w-2.5 h-2.5 text-blue-400" />
                      <span>{tagBandPerson.startsWith('@') ? tagBandPerson : `@${tagBandPerson}`}</span>
                    </div>
                  )}
                </div>

                {/* Draggable/Positionable Text Overlay */}
                {newStoryTextOverlay && (
                  <div
                    style={{
                      top: `${newStoryTextY}%`,
                      left: `${newStoryTextX}%`,
                      transform: 'translate(-50%, -50%)',
                      color: newStoryTextColorHex,
                      fontSize: `${newStoryTextSize}px`,
                      textAlign: textAlign
                    }}
                    className={`absolute z-10 px-3 py-1.5 rounded-lg font-bold leading-tight max-w-[85%] whitespace-pre-wrap break-words drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] pointer-events-none ${
                      newStoryTextStyle === 'neon'
                        ? 'bg-black/60 border border-current shadow-[0_0_15px_currentColor]'
                        : newStoryTextStyle === 'bold'
                        ? 'bg-black/80 font-black uppercase tracking-wider'
                        : newStoryTextStyle === 'subtle'
                        ? 'bg-zinc-900/90 backdrop-blur font-mono text-xs'
                        : newStoryTextStyle === 'gothic'
                        ? 'bg-red-950/80 border border-red-500/40 font-black tracking-widest text-red-100'
                        : newStoryTextStyle === 'sticker_tag'
                        ? 'bg-yellow-400 text-black font-black uppercase -rotate-2 px-2 py-1 shadow-lg'
                        : ''
                    }`}
                  >
                    {newStoryTextOverlay}
                  </div>
                )}

                {/* Interactive Poll Card (Facebook Story Style) */}
                {pollQuestion && (
                  <div className="relative z-10 my-auto p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-rose-500/40 shadow-xl pointer-events-none">
                    <div className="flex items-center gap-1.5 mb-1.5 text-rose-400 text-[9px] font-mono font-bold uppercase tracking-wider">
                      <HelpCircle className="w-3 h-3" /> PIT POLL
                    </div>
                    <p className="text-[11px] font-bold text-white mb-2 leading-tight">{pollQuestion}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="py-1 px-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-[9px] font-mono font-bold text-center text-zinc-200">
                        {pollOption1 || 'Yes'}
                      </div>
                      <div className="py-1 px-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-[9px] font-mono font-bold text-center text-zinc-200">
                        {pollOption2 || 'No'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stickers Overlay */}
                {newStoryStickers.map((stk, idx) => (
                  <div
                    key={`story-sticker-${stk}-${idx}`}
                    style={{
                      top: `${newStoryStickerY}%`,
                      left: `${newStoryStickerX}%`,
                      transform: `translate(-50%, -50%) scale(${newStoryStickerScale})`
                    }}
                    className="absolute z-10 text-xl drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none font-bold"
                  >
                    {stk}
                  </div>
                ))}

                {/* Bottom Badges: Music & External Link */}
                <div className="relative z-10 flex flex-col gap-1 w-full pointer-events-none">
                  {externalLink && (
                    <div className="self-center flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-black text-[9px] font-mono font-black uppercase tracking-wider shadow-lg">
                      <Link className="w-3 h-3 text-rose-600" />
                      <span className="truncate max-w-[150px]">{externalLink.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}

                  {/* Sound Track Badge & Simulated Waveform */}
                  {newStoryMusic && (
                    <div className="self-start flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur border border-rose-500/40 text-[9px] font-mono text-rose-400 font-bold tracking-wider uppercase shadow">
                      <Music2 className="w-3 h-3 text-rose-500 animate-pulse" />
                      <span className="truncate max-w-[130px]">{newStoryMusic}</span>
                      {isPlayingAudioPreview && (
                        <div className="flex items-center gap-0.5 h-3 ml-1">
                          <span className="w-0.5 h-full bg-rose-500 animate-pulse" />
                          <span className="w-0.5 h-2/3 bg-rose-400 animate-pulse delay-75" />
                          <span className="w-0.5 h-4/5 bg-rose-500 animate-pulse delay-150" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Studio Controls (7 cols) */}
            <div className="md:col-span-7 p-6 flex flex-col justify-between bg-[#0b0c0f]">
              <div className="space-y-4">
                {/* Media File & URL Attachment Bar */}
                <div className="space-y-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-900">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <Upload className="w-3 h-3 text-rose-500" /> Story Media Background
                    </label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <ImageIcon className="w-3 h-3" /> Upload File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Image URL..."
                      value={newStoryImage}
                      onChange={(e) => {
                        setNewStoryImage(e.target.value);
                        if (e.target.value) setNewStoryVideo('');
                      }}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Video URL (.mp4)..."
                      value={newStoryVideo}
                      onChange={(e) => {
                        setNewStoryVideo(e.target.value);
                        if (e.target.value) setNewStoryImage('');
                      }}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Studio Control Sub-Tabs */}
                <div className="flex border-b border-zinc-900 gap-1 pb-1 overflow-x-auto custom-scrollbar">
                  {[
                    { id: 'text', label: 'TEXT', icon: Type },
                    { id: 'interactive', label: 'INTERACTIVE', icon: HelpCircle },
                    { id: 'effects', label: 'FILTERS', icon: Sliders },
                    { id: 'music', label: 'AUDIO', icon: Music },
                    { id: 'stickers', label: 'STICKERS', icon: Sticker },
                    { id: 'border', label: 'AURA', icon: Palette },
                    { id: 'preset', label: 'BG PRESETS', icon: Sparkles }
                  ].map((tab, tabIdx) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={`story-tab-${tab.id}-${tabIdx}`}
                        onClick={() => setStorySubTab(tab.id as any)}
                        className={`py-2 px-2.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                          storySubTab === tab.id
                            ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                            : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800/60'
                        }`}
                      >
                        <Icon className="w-3 h-3" /> {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sub Tab Panel: TEXT OVERLAY */}
                {storySubTab === 'text' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <textarea
                      placeholder="Type text overlay..."
                      value={newStoryTextOverlay}
                      onChange={(e) => setNewStoryTextOverlay(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors h-16 resize-none"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-mono text-zinc-500 uppercase font-bold block mb-1">
                          FONT STYLE
                        </label>
                        <select
                          value={newStoryTextStyle}
                          onChange={(e) => setNewStoryTextStyle(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value="neon">NEON GLOW</option>
                          <option value="bold">HEAVY SLAM BOLD</option>
                          <option value="subtle">CLEAN MONO</option>
                          <option value="gothic">GOTHIC RED</option>
                          <option value="sticker_tag">YELLOW TAG</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-mono text-zinc-500 uppercase font-bold block mb-1">
                          ALIGNMENT
                        </label>
                        <div className="flex border border-zinc-800 rounded-xl p-0.5 bg-zinc-900">
                          <button
                            onClick={() => setTextAlign('left')}
                            className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs ${textAlign === 'left' ? 'bg-zinc-800 text-rose-400' : 'text-zinc-500'}`}
                          >
                            <AlignLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setTextAlign('center')}
                            className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs ${textAlign === 'center' ? 'bg-zinc-800 text-rose-400' : 'text-zinc-500'}`}
                          >
                            <AlignCenter className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setTextAlign('right')}
                            className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs ${textAlign === 'right' ? 'bg-zinc-800 text-rose-400' : 'text-zinc-500'}`}
                          >
                            <AlignRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-mono text-zinc-500 uppercase font-bold block mb-1">
                          COLOR
                        </label>
                        <div className="flex items-center gap-1">
                          {['#ffffff', '#f43f5e', '#38bdf8', '#a855f7', '#39ff14', '#eab308'].map((clr, cIdx) => (
                            <button
                              key={`clr-${clr}-${cIdx}`}
                              onClick={() => setNewStoryTextColorHex(clr)}
                              style={{ backgroundColor: clr }}
                              className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                                newStoryTextColorHex === clr ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Text Position Sliders */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">POS Y ({newStoryTextY}%)</span>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={newStoryTextY}
                          onChange={(e) => setNewStoryTextY(Number(e.target.value))}
                          className="w-full accent-rose-500"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">TEXT SIZE ({newStoryTextSize}px)</span>
                        <input
                          type="range"
                          min="12"
                          max="32"
                          value={newStoryTextSize}
                          onChange={(e) => setNewStoryTextSize(Number(e.target.value))}
                          className="w-full accent-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel: INTERACTIVE (Facebook Story Creator Style) */}
                {storySubTab === 'interactive' && (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    {/* Tag Band or Person */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase font-bold text-zinc-300 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-400" /> Tag Band / Person
                        </label>
                        {tagBandPerson && (
                          <button
                            onClick={() => setTagBandPerson('')}
                            className="text-[9px] font-mono text-zinc-500 hover:text-rose-400"
                          >
                            CLEAR
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. @devourment or band username..."
                        value={tagBandPerson}
                        onChange={(e) => setTagBandPerson(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Feeling / Activity Mood */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase font-bold text-zinc-300 flex items-center gap-1.5">
                          <Smile className="w-3.5 h-3.5 text-rose-400" /> Feeling / Activity
                        </label>
                        {feelingMood && (
                          <button
                            onClick={() => setFeelingMood('')}
                            className="text-[9px] font-mono text-zinc-500 hover:text-rose-400"
                          >
                            CLEAR
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '🤘 Headbanging',
                          '🔥 In the Pit',
                          '🍻 Backstage',
                          '💀 Hyped',
                          '⚡ Live Onstage',
                          '🎧 Soundcheck',
                          '🩸 Brutalizing'
                        ].map((mood, mIdx) => (
                          <button
                            key={`mood-${mIdx}`}
                            onClick={() => setFeelingMood(feelingMood === mood ? '' : mood)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              feelingMood === mood
                                ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                                : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Poll */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase font-bold text-zinc-300 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-yellow-400" /> Interactive Pit Poll
                        </label>
                        {pollQuestion && (
                          <button
                            onClick={() => {
                              setPollQuestion('');
                              setPollOption1('🔥 Hell Yeah');
                              setPollOption2('💀 Hard Pass');
                            }}
                            className="text-[9px] font-mono text-zinc-500 hover:text-rose-400"
                          >
                            CLEAR
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Ask a question (e.g. Which riff goes harder?)..."
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                      {pollQuestion && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Option 1"
                            value={pollOption1}
                            onChange={(e) => setPollOption1(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200"
                          />
                          <input
                            type="text"
                            placeholder="Option 2"
                            value={pollOption2}
                            onChange={(e) => setPollOption2(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Link Sticker & Timestamp Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1">
                          <Link className="w-3 h-3 text-cyan-400" /> Web / Bandcamp Link
                        </label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={externalLink}
                          onChange={(e) => setExternalLink(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase font-bold text-zinc-400">
                          <Clock className="w-3 h-3 text-rose-400" /> Timestamp Badge
                        </div>
                        <button
                          onClick={() => setShowTimestampBadge(!showTimestampBadge)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${
                            showTimestampBadge
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-zinc-950 text-zinc-500 border border-zinc-800'
                          }`}
                        >
                          {showTimestampBadge ? 'VISIBLE' : 'HIDDEN'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel: CAMERA / AESTHETIC FILTERS (Facebook Story Filters) */}
                {storySubTab === 'effects' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                      CAMERA & MEDIA FILTER OVERLAYS
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'normal', label: 'NORMAL', desc: 'Raw feed' },
                        { id: 'vhs', label: '90s VHS', desc: 'CRT tape glow' },
                        { id: 'grunge', label: 'GRUNGE', desc: 'Sepia slam grit' },
                        { id: 'noir', label: 'NOIR MONO', desc: 'High-contrast bw' },
                        { id: 'toxic', label: 'TOXIC SLIME', desc: 'Acid hue shift' },
                        { id: 'hyper', label: 'HYPER BEAST', desc: 'Ultra saturation' }
                      ].map((f) => (
                        <button
                          key={`filter-${f.id}`}
                          onClick={() => setStoryFilter(f.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            storyFilter === f.id
                              ? 'bg-zinc-800 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold uppercase">{f.label}</div>
                          <div className="text-[9px] text-zinc-500">{f.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel: SOUNDTRACK */}
                {storySubTab === 'music' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">SELECT SOUNDTRACK TAPE</label>
                      {newStoryMusic && (
                        <button
                          onClick={() => setIsPlayingAudioPreview(!isPlayingAudioPreview)}
                          className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          {isPlayingAudioPreview ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {isPlayingAudioPreview ? 'Pause Audio' : 'Preview Track'}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {[
                        'IMMOLATION - Father You’re Not a Father',
                        'CRYPTOPSY - Slit Your Gut',
                        'DYING FETUS - Subjected to a Beating',
                        'DEVOURMENT - Babykiller',
                        'INTERNAL BLEEDING - Uncontrollable Demise',
                        'MORTICIAN - Chainsaw Dismemberment'
                      ].map((trk, trkIdx) => (
                        <button
                          key={`story-trk-${trk}-${trkIdx}`}
                          onClick={() => {
                            setNewStoryMusic(trk);
                            setIsPlayingAudioPreview(true);
                          }}
                          className={`p-2.5 rounded-xl border text-left text-xs font-mono transition-all cursor-pointer ${
                            newStoryMusic === trk
                              ? 'bg-rose-950/30 border-rose-500 text-rose-300 font-bold shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Music2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{trk}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel: STICKERS */}
                {storySubTab === 'stickers' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">ATTACH SCENE STICKERS</label>
                    <div className="flex flex-wrap gap-2">
                      {['🔥 PIT LORD', '⚡ LIVE AT THE PIT', '🤘 SLAM SQUAD', '💀 GORE GRIND', '🎸 HEAVY RIFFS', '🎧 100% LOUD', '🏆 SCENE APPROVED', '🎟️ FRONT ROW', '📹 VHS BOOTLEG'].map((stk, stkIdx) => {
                        const isAttached = newStoryStickers.includes(stk);
                        return (
                          <button
                            key={`story-stk-${stk}-${stkIdx}`}
                            onClick={() => {
                              if (!isAttached) {
                                setNewStoryStickers((prev) => [...prev, stk]);
                              } else {
                                setNewStoryStickers((prev) => prev.filter(s => s !== stk));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                              isAttached
                                ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            {stk} {isAttached && '✓'}
                          </button>
                        );
                      })}
                    </div>
                    {newStoryStickers.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">STICKER SCALE ({newStoryStickerScale}x)</span>
                          <input
                            type="range"
                            min="0.5"
                            max="2.5"
                            step="0.1"
                            value={newStoryStickerScale}
                            onChange={(e) => setNewStoryStickerScale(Number(e.target.value))}
                            className="w-full accent-rose-500"
                          />
                        </div>
                        <button
                          onClick={() => setNewStoryStickers([])}
                          className="self-end py-1 px-3 bg-red-950/40 border border-red-800 text-red-400 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-red-900/60"
                        >
                          <Trash2 className="w-3 h-3" /> Clear Stickers
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub Tab Panel: AURA BORDER */}
                {storySubTab === 'border' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">CANVAS BORDER AURA</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.4)]', label: 'ROSE FLAME' },
                        { id: 'border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.4)]', label: 'PURPLE VOID' },
                        { id: 'border-cyan-400/80 shadow-[0_0_20px_rgba(56,189,248,0.4)]', label: 'CYAN NEON' },
                        { id: 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.4)]', label: 'TOXIC SLIME' }
                      ].map((b, bIdx) => (
                        <button
                          key={`story-border-${bIdx}`}
                          onClick={() => setNewStoryBorder(b.id)}
                          className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                            newStoryBorder === b.id
                              ? 'bg-zinc-800 border-white text-white shadow'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel: BG PRESETS */}
                {storySubTab === 'preset' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">CANVAS ATMOSPHERE PRESET</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'from-rose-950/80 via-zinc-950 to-purple-950/80', label: 'SLAM VOID' },
                        { id: 'from-cyan-950/80 via-zinc-950 to-fuchsia-950/80', label: 'CYAN NEON' },
                        { id: 'from-emerald-950/80 via-zinc-950 to-lime-950/80', label: 'TOXIC GREEN' },
                        { id: 'from-red-950/90 via-black to-red-900/80', label: 'BLOOD MOON' }
                      ].map((p, pIdx) => (
                        <button
                          key={`story-preset-${pIdx}`}
                          onClick={() => {
                            setPresetBg(p.id);
                            setNewStoryImage('');
                            setNewStoryVideo('');
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                            presetBg === p.id && !newStoryImage && !newStoryVideo
                              ? 'bg-zinc-800 border-rose-500 text-rose-300 shadow'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons (Sticky at bottom of controls panel) */}
              <div className="sticky bottom-0 bg-[#0b0c0f]/95 backdrop-blur-md flex items-center justify-between pt-4 pb-2 border-t border-zinc-900 mt-4 z-20">
                <button
                  onClick={() => setShowUploadStoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handlePostStory}
                  disabled={isUploading}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black uppercase text-xs tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.35)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] cursor-pointer flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{uploadStatusMsg || "Uploading to Stories Bucket..."}</span>
                    </>
                  ) : (
                    "Post Story"
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

