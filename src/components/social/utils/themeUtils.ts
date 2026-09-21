import { roleTheme } from '../../../data/socialFeedMockData';

export const proTheme = {
  name: 'Industry Pro',
  textClass: 'text-violet-500',
  borderClass: 'border-violet-700/45',
  hoverBorderClass: 'hover:border-violet-600/70',
  bgClass: 'bg-violet-950/60',
  bgBadge: 'bg-violet-950 text-violet-500 border border-violet-700/50',
  glowClass: 'shadow-[0_0_20px_rgba(109,40,217,0.35)]',
  pulseGlow: 'animate-pulse-glow-violet',
  stripClass: 'from-violet-800 via-purple-700 to-violet-950',
  accentColor: '#6d28d9',
  accentColorRgba: 'rgba(109,40,217,0.3)',
  gridColor: 'rgba(109,40,217,0.03)',
  btnClass: 'bg-violet-700 hover:bg-violet-600 text-white',
};

export const royalBlueTheme = {
  name: 'Fan-Only Profile',
  textClass: 'text-cyan-500',
  borderClass: 'border-cyan-500',
  hoverBorderClass: 'hover:border-cyan-500',
  bgClass: 'bg-cyan-950/40',
  bgBadge: 'bg-cyan-950 text-cyan-500 border border-cyan-500',
  glowClass: 'shadow-[0_0_15px_rgba(6,182,212,0.35)]',
  pulseGlow: 'animate-pulse-glow-cyan',
  stripClass: 'from-cyan-500 via-cyan-500 to-cyan-500',
  accentColor: '#06b6d4',
  accentColorRgba: 'rgba(6,182,212,0.25)',
  gridColor: 'rgba(6,182,212,0.025)',
  btnClass: 'bg-cyan-600 hover:bg-cyan-500 text-white',
};

export const fanTheme = royalBlueTheme;

export function getSocialTheme(portalRole: string, isProfessional: boolean) {
  const activeRoleTheme = {
    ...roleTheme,
    fan: royalBlueTheme,
    fan_only: royalBlueTheme,
    industry_pro: proTheme
  };

  const normRole = (portalRole === 'fan' || portalRole === 'fan_only') ? 'fan_only' : portalRole;

  const currentTheme = normRole === 'fan_only' 
    ? royalBlueTheme 
    : (normRole === 'industry_pro' ? proTheme : (activeRoleTheme[normRole as keyof typeof activeRoleTheme] || (isProfessional ? proTheme : royalBlueTheme)));

  return { activeRoleTheme, currentTheme };
}
