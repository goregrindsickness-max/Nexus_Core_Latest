import React from 'react';

export interface ThreadTheme {
  id: string;
  name: string;
  vibe: string;
  accentHex: string;
  secondaryHex: string;
  swatchGradient: string;
  // Unread left-edge splash by avatar in Inbox list
  unreadEdgeSplashStyle: React.CSSProperties;
  unreadEdgeBarStyle: React.CSSProperties;
  unreadAvatarGlowStyle: React.CSSProperties;
  unreadRowBorderClass: string;
  unreadBadgeClass: string;
  unreadDotClass: string;
  unreadTimeClass: string;
  // Active thread appearance
  canvasAtmosphereStyle: React.CSSProperties;
  headerAccentStyle: React.CSSProperties;
  sentBubbleClass: string;
  sentBubbleStyle: React.CSSProperties;
  sentMetaTextClass: string;
  sentCheckClass: string;
  replyBorderClass: string;
  replyLabelClass: string;
  sendButtonClass: string;
  accentIconClass: string;
  typingDotClass: string;
  composerFocusClass: string;
}

export const THREAD_THEMES: ThreadTheme[] = [
  {
    id: 'crimson',
    name: 'Crimson Pit',
    vibe: 'Default Scene',
    accentHex: '#f43f5e',
    secondaryHex: '#9f1239',
    swatchGradient: 'linear-gradient(135deg, #f43f5e 0%, #881337 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(244, 63, 94, 0.22) 0%, rgba(244, 63, 94, 0.08) 38%, rgba(244, 63, 94, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)',
      boxShadow: '0 0 12px rgba(244, 63, 94, 0.65)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 18px -2px rgba(244, 63, 94, 0.45)',
    },
    unreadRowBorderClass: 'border-rose-500/25 hover:border-rose-500/40',
    unreadBadgeClass: 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]',
    unreadDotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    unreadTimeClass: 'text-rose-400 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#07080b',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(244, 63, 94, 0.07) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(159, 18, 57, 0.06) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(244, 63, 94, 0.18)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-rose-500/35',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #31131e 0%, #220d15 100%)',
    },
    sentMetaTextClass: 'text-rose-200/70',
    sentCheckClass: 'text-rose-400',
    replyBorderClass: 'border-rose-500/35 hover:border-rose-400/60',
    replyLabelClass: 'text-rose-400',
    sendButtonClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50',
    accentIconClass: 'text-rose-400',
    typingDotClass: 'bg-rose-500',
    composerFocusClass: 'focus:border-rose-500/60',
  },
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    vibe: 'Electric Synth',
    accentHex: '#06b6d4',
    secondaryHex: '#0e7490',
    swatchGradient: 'linear-gradient(135deg, #22d3ee 0%, #0e7490 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(6, 182, 212, 0.22) 0%, rgba(6, 182, 212, 0.08) 38%, rgba(6, 182, 212, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #67e8f9 0%, #0891b2 100%)',
      boxShadow: '0 0 12px rgba(6, 182, 212, 0.65)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 18px -2px rgba(6, 182, 212, 0.45)',
    },
    unreadRowBorderClass: 'border-cyan-500/25 hover:border-cyan-500/40',
    unreadBadgeClass: 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]',
    unreadDotClass: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    unreadTimeClass: 'text-cyan-400 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#06090d',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(6, 182, 212, 0.08) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(14, 116, 144, 0.07) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(6, 182, 212, 0.2)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-cyan-500/35',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #0d262f 0%, #091a21 100%)',
    },
    sentMetaTextClass: 'text-cyan-200/70',
    sentCheckClass: 'text-cyan-400',
    replyBorderClass: 'border-cyan-500/35 hover:border-cyan-400/60',
    replyLabelClass: 'text-cyan-400',
    sendButtonClass: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50',
    accentIconClass: 'text-cyan-400',
    typingDotClass: 'bg-cyan-400',
    composerFocusClass: 'focus:border-cyan-500/60',
  },
  {
    id: 'ultraviolet',
    name: 'Ultraviolet Void',
    vibe: 'Cosmic Riff',
    accentHex: '#a855f7',
    secondaryHex: '#6b21a8',
    swatchGradient: 'linear-gradient(135deg, #c084fc 0%, #581c87 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(168, 85, 247, 0.22) 0%, rgba(168, 85, 247, 0.08) 38%, rgba(168, 85, 247, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #c084fc 0%, #9333ea 100%)',
      boxShadow: '0 0 12px rgba(168, 85, 247, 0.65)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 18px -2px rgba(168, 85, 247, 0.45)',
    },
    unreadRowBorderClass: 'border-purple-500/25 hover:border-purple-500/40',
    unreadBadgeClass: 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]',
    unreadDotClass: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
    unreadTimeClass: 'text-purple-400 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#08070c',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(168, 85, 247, 0.08) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(107, 33, 168, 0.07) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(168, 85, 247, 0.2)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-purple-500/35',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #231338 0%, #160c24 100%)',
    },
    sentMetaTextClass: 'text-purple-200/70',
    sentCheckClass: 'text-purple-400',
    replyBorderClass: 'border-purple-500/35 hover:border-purple-400/60',
    replyLabelClass: 'text-purple-400',
    sendButtonClass: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50',
    accentIconClass: 'text-purple-400',
    typingDotClass: 'bg-purple-400',
    composerFocusClass: 'focus:border-purple-500/60',
  },
  {
    id: 'venom',
    name: 'Acid Venom',
    vibe: 'Toxic Pit',
    accentHex: '#10b981',
    secondaryHex: '#065f46',
    swatchGradient: 'linear-gradient(135deg, #34d399 0%, #065f46 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.08) 38%, rgba(16, 185, 129, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #6ee7b7 0%, #059669 100%)',
      boxShadow: '0 0 12px rgba(16, 185, 129, 0.65)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 18px -2px rgba(16, 185, 129, 0.45)',
    },
    unreadRowBorderClass: 'border-emerald-500/25 hover:border-emerald-500/40',
    unreadBadgeClass: 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    unreadDotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    unreadTimeClass: 'text-emerald-400 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#060a09',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(16, 185, 129, 0.08) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(6, 95, 70, 0.07) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(16, 185, 129, 0.2)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-emerald-500/35',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #0d2922 0%, #081c17 100%)',
    },
    sentMetaTextClass: 'text-emerald-200/70',
    sentCheckClass: 'text-emerald-400',
    replyBorderClass: 'border-emerald-500/35 hover:border-emerald-400/60',
    replyLabelClass: 'text-emerald-400',
    sendButtonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50',
    accentIconClass: 'text-emerald-400',
    typingDotClass: 'bg-emerald-400',
    composerFocusClass: 'focus:border-emerald-500/60',
  },
  {
    id: 'amber',
    name: 'Molten Amber',
    vibe: 'Pyro Stage',
    accentHex: '#f59e0b',
    secondaryHex: '#9a3412',
    swatchGradient: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.08) 38%, rgba(245, 158, 11, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #fcd34d 0%, #d97706 100%)',
      boxShadow: '0 0 12px rgba(245, 158, 11, 0.65)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 18px -2px rgba(245, 158, 11, 0.45)',
    },
    unreadRowBorderClass: 'border-amber-500/25 hover:border-amber-500/40',
    unreadBadgeClass: 'bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]',
    unreadDotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    unreadTimeClass: 'text-amber-400 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#0a0806',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(245, 158, 11, 0.08) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(180, 83, 9, 0.06) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(245, 158, 11, 0.2)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-amber-500/35',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #2e1d0d 0%, #1f1308 100%)',
    },
    sentMetaTextClass: 'text-amber-200/70',
    sentCheckClass: 'text-amber-400',
    replyBorderClass: 'border-amber-500/35 hover:border-amber-400/60',
    replyLabelClass: 'text-amber-400',
    sendButtonClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50',
    accentIconClass: 'text-amber-400',
    typingDotClass: 'bg-amber-400',
    composerFocusClass: 'focus:border-amber-500/60',
  },
  {
    id: 'cobalt',
    name: 'Cobalt Frost',
    vibe: 'Subzero',
    accentHex: '#3b82f6',
    secondaryHex: '#1d4ed8',
    swatchGradient: 'linear-gradient(135deg, #60a5fa 0%, #1e40af 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0.08) 38%, rgba(59, 130, 246, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #93c5fd 0%, #2563eb 100%)',
      boxShadow: '0 0 12px rgba(59, 130, 246, 0.65)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 18px -2px rgba(59, 130, 246, 0.45)',
    },
    unreadRowBorderClass: 'border-blue-500/25 hover:border-blue-500/40',
    unreadBadgeClass: 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]',
    unreadDotClass: 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    unreadTimeClass: 'text-blue-400 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#06080d',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(59, 130, 246, 0.08) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(29, 78, 216, 0.07) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(59, 130, 246, 0.2)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-blue-500/35',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #101f3c 0%, #0b1528 100%)',
    },
    sentMetaTextClass: 'text-blue-200/70',
    sentCheckClass: 'text-blue-400',
    replyBorderClass: 'border-blue-500/35 hover:border-blue-400/60',
    replyLabelClass: 'text-blue-400',
    sendButtonClass: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/50',
    accentIconClass: 'text-blue-400',
    typingDotClass: 'bg-blue-400',
    composerFocusClass: 'focus:border-blue-500/60',
  },
  {
    id: 'magenta',
    name: 'Synthwave Magenta',
    vibe: 'Neon Riot',
    accentHex: '#ec4899',
    secondaryHex: '#9d174d',
    swatchGradient: 'linear-gradient(135deg, #f472b6 0%, #831843 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(236, 72, 153, 0.22) 0%, rgba(236, 72, 153, 0.08) 38%, rgba(236, 72, 153, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #f9a8d4 0%, #db2777 100%)',
      boxShadow: '0 0 12px rgba(236, 72, 153, 0.65)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 18px -2px rgba(236, 72, 153, 0.45)',
    },
    unreadRowBorderClass: 'border-pink-500/25 hover:border-pink-500/40',
    unreadBadgeClass: 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]',
    unreadDotClass: 'bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.6)]',
    unreadTimeClass: 'text-pink-400 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#09060b',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(236, 72, 153, 0.08) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(131, 24, 67, 0.07) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(236, 72, 153, 0.2)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-pink-500/35',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #2d1228 0%, #1d0b1a 100%)',
    },
    sentMetaTextClass: 'text-pink-200/70',
    sentCheckClass: 'text-pink-400',
    replyBorderClass: 'border-pink-500/35 hover:border-pink-400/60',
    replyLabelClass: 'text-pink-400',
    sendButtonClass: 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-950/50',
    accentIconClass: 'text-pink-400',
    typingDotClass: 'bg-pink-400',
    composerFocusClass: 'focus:border-pink-500/60',
  },
  {
    id: 'bloodmoon',
    name: 'Blood Moon',
    vibe: 'Dark Ritual',
    accentHex: '#ef4444',
    secondaryHex: '#7f1d1d',
    swatchGradient: 'linear-gradient(135deg, #dc2626 0%, #450a0a 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(220, 38, 38, 0.24) 0%, rgba(185, 28, 28, 0.09) 38%, rgba(220, 38, 38, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #f87171 0%, #b91c1c 100%)',
      boxShadow: '0 0 12px rgba(239, 68, 68, 0.7)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 18px -2px rgba(239, 68, 68, 0.45)',
    },
    unreadRowBorderClass: 'border-red-500/25 hover:border-red-500/40',
    unreadBadgeClass: 'bg-red-700 text-white shadow-[0_0_10px_rgba(239,68,68,0.45)]',
    unreadDotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]',
    unreadTimeClass: 'text-red-400 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#090606',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(220, 38, 38, 0.08) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(127, 29, 29, 0.08) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(239, 68, 68, 0.2)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-red-500/35',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #2b0f0f 0%, #1a0808 100%)',
    },
    sentMetaTextClass: 'text-red-200/70',
    sentCheckClass: 'text-red-400',
    replyBorderClass: 'border-red-500/35 hover:border-red-400/60',
    replyLabelClass: 'text-red-400',
    sendButtonClass: 'bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-950/50',
    accentIconClass: 'text-red-400',
    typingDotClass: 'bg-red-500',
    composerFocusClass: 'focus:border-red-500/60',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Chrome',
    vibe: 'Monochrome',
    accentHex: '#e4e4e7',
    secondaryHex: '#52525b',
    swatchGradient: 'linear-gradient(135deg, #f4f4f5 0%, #3f3f46 100%)',
    unreadEdgeSplashStyle: {
      background:
        'linear-gradient(90deg, rgba(228, 228, 231, 0.16) 0%, rgba(161, 161, 170, 0.06) 38%, rgba(228, 228, 231, 0) 100%)',
    },
    unreadEdgeBarStyle: {
      background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
      boxShadow: '0 0 10px rgba(255, 255, 255, 0.45)',
    },
    unreadAvatarGlowStyle: {
      boxShadow: '0 0 16px -2px rgba(228, 228, 231, 0.3)',
    },
    unreadRowBorderClass: 'border-zinc-400/25 hover:border-zinc-300/40',
    unreadBadgeClass: 'bg-zinc-100 text-zinc-950 shadow-[0_0_10px_rgba(255,255,255,0.25)]',
    unreadDotClass: 'bg-zinc-200 shadow-[0_0_8px_rgba(255,255,255,0.5)]',
    unreadTimeClass: 'text-zinc-200 font-semibold',
    canvasAtmosphereStyle: {
      backgroundColor: '#07080a',
      backgroundImage:
        'radial-gradient(circle at 85% 12%, rgba(228, 228, 231, 0.05) 0%, transparent 45%), radial-gradient(circle at 15% 88%, rgba(113, 113, 122, 0.05) 0%, transparent 45%)',
    },
    headerAccentStyle: {
      borderBottomColor: 'rgba(228, 228, 231, 0.15)',
    },
    sentBubbleClass: 'text-white rounded-2xl rounded-br-sm border border-zinc-400/30',
    sentBubbleStyle: {
      background: 'linear-gradient(135deg, #27272a 0%, #18181b 100%)',
    },
    sentMetaTextClass: 'text-zinc-300/75',
    sentCheckClass: 'text-zinc-200',
    replyBorderClass: 'border-zinc-400/35 hover:border-zinc-300/60',
    replyLabelClass: 'text-zinc-200',
    sendButtonClass: 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-lg',
    accentIconClass: 'text-zinc-200',
    typingDotClass: 'bg-zinc-300',
    composerFocusClass: 'focus:border-zinc-400/60',
  },
];

export const DEFAULT_THREAD_THEME: ThreadTheme = THREAD_THEMES[0];

export function getThreadTheme(themeId?: string | null): ThreadTheme {
  if (!themeId) return DEFAULT_THREAD_THEME;
  return THREAD_THEMES.find((t) => t.id === themeId) || DEFAULT_THREAD_THEME;
}

const THREAD_THEMES_STORAGE_KEY = 'nexus_inbox_thread_themes_v1';

export function readStoredThreadThemes(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(THREAD_THEMES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeStoredThreadThemes(themes: Record<string, string>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(THREAD_THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch {
    // ignore storage quota errors
  }
}
