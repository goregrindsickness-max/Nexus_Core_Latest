import React from 'react';

export interface ProfileGlowInfo {
  type: 'industry_pro' | 'fan' | 'band' | 'promoter' | 'creative' | 'label';
  name: string;
  color: string;
  rgb: string;
  glowClass: string;
  cardStyle: React.CSSProperties;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const getProfileGlowInfo = (profile: any): ProfileGlowInfo => {
  const rLower = (profile?.role || profile?.portalRole || profile?.account_type || profile?.type || '').toLowerCase();
  const accType = (profile?.account_type || profile?.type || profile?.portalRole || '').toLowerCase();
  const rawType = (profile?.type || '').toLowerCase();
  const isPersonal = profile?.isPersonal === true || profile?.isIndustryProPersonal === true;
  const workspaces = [
    ...(profile?.registered_workspaces || []),
    ...(profile?.allowed_workspaces || [])
  ].map((w: string) => typeof w === 'string' ? w.toLowerCase() : '');

  const createInfo = (
    type: ProfileGlowInfo['type'],
    name: string,
    color: string,
    rgb: string,
    glowClass: string,
    badgeBg: string,
    badgeText: string,
    badgeBorder: string
  ): ProfileGlowInfo => ({
    type,
    name,
    color,
    rgb,
    glowClass,
    cardStyle: {
      borderColor: `${color}bb`,
      boxShadow: `0 0 24px rgba(${rgb}, 0.28), 0 0 50px rgba(${rgb}, 0.12), inset 0 0 12px rgba(${rgb}, 0.08)`
    },
    badgeBg,
    badgeText,
    badgeBorder
  });

  // 1. Explicit Creative Profile (Neon Pink / Magenta: #ff007f)
  if (rawType === 'creative' || accType === 'creative' || profile?.portalRole === 'creative' || rLower === 'creative' || rLower.includes('creative specialist') || rLower.includes('designer') || rLower.includes('photographer') || rLower.includes('videographer') || rLower.includes('audio engineer')) {
    return createInfo(
      'creative',
      'Creative Specialist',
      '#ff007f',
      '255, 0, 127',
      'pulse-glow-magenta',
      'bg-pink-950/40',
      'text-pink-400',
      'border-pink-500/50'
    );
  }

  // 2. Explicit Record Label Profile (Neon Orange: #ff6b00)
  if (rawType === 'label' || accType === 'label' || profile?.portalRole === 'label' || rLower === 'label' || rLower.includes('record label') || rLower.includes('label executive')) {
    return createInfo(
      'label',
      'Record Label',
      '#ff6b00',
      '255, 107, 0',
      'pulse-glow-orange',
      'bg-orange-950/40',
      'text-orange-400',
      'border-orange-500/50'
    );
  }

  // 3. Explicit Promoter / Venue Profile (Neon Yellow: #ffe600)
  if (rawType === 'promoter' || accType === 'promoter' || profile?.portalRole === 'promoter' || rLower === 'promoter' || rLower.includes('venue') || rLower.includes('talent buyer') || rLower.includes('booking agent')) {
    return createInfo(
      'promoter',
      'Promoter / Venue',
      '#ffe600',
      '255, 230, 0',
      'pulse-glow-yellow',
      'bg-amber-950/40',
      'text-amber-400',
      'border-amber-500/50'
    );
  }

  // 4. Explicit Band / Artist Profile (Neon Green: #39ff14)
  if (profile?.isBandProfile || rawType === 'band' || accType === 'band' || profile?.portalRole === 'band' || (rLower.includes('band') && !rLower.includes('fan')) || (rLower.includes('artist') && !rLower.includes('fan')) || rLower.includes('musician') || rLower.includes('group')) {
    return createInfo(
      'band',
      'Band / Artist',
      '#39ff14',
      '57, 255, 20',
      'pulse-glow-green',
      'bg-emerald-950/40',
      'text-[#39ff14]',
      'border-[#39ff14]/50'
    );
  }

  // 5. Explicit Fan check (Electric Cyan: #00e5ff)
  if (
    accType === 'fan' || 
    accType === 'fan_only' || 
    accType === 'listener' || 
    rLower === 'fan' || 
    rLower === 'fan_only' || 
    rLower === 'fan listener' || 
    (rLower.includes('fan') && !rLower.includes('industry')) ||
    ((workspaces.includes('fan') || workspaces.includes('fan_only')) && !workspaces.some(w => ['creative', 'band', 'promoter', 'label', 'industry_pro', 'industry pro'].includes(w)))
  ) {
    return createInfo(
      'fan',
      'Fan Supporter',
      '#00e5ff',
      '0, 229, 255',
      'pulse-glow-blue',
      'bg-cyan-950/40',
      'text-cyan-400',
      'border-cyan-500/50'
    );
  }

  // 6. Industry Pro (Cyber Purple: #a855f7)
  if (
    isPersonal ||
    workspaces.includes('industry_pro') || 
    workspaces.includes('industry pro') ||
    profile?.account_type === 'industry_pro' || 
    profile?.account_type === 'industry pro' || 
    profile?.account_type === 'pro' || 
    profile?.account_type === 'admin' || 
    profile?.is_pro === true || 
    rLower.includes('industry_pro') || 
    rLower.includes('industry pro') || 
    rLower.includes('industry') || 
    rLower.includes('operator') || 
    rLower.includes('founder') || 
    rLower.includes('admin') || 
    rLower.includes('chief')
  ) {
    return createInfo(
      'industry_pro',
      'Industry Pro',
      '#a855f7',
      '168, 85, 247',
      'pulse-glow-purple',
      'bg-purple-950/40',
      'text-purple-400',
      'border-purple-500/50'
    );
  }

  // 7. Fallback Fan Supporter = Electric Cyan
  return createInfo(
    'fan',
    'Fan Supporter',
    '#00e5ff',
    '0, 229, 255',
    'pulse-glow-blue',
    'bg-cyan-950/40',
    'text-cyan-400',
    'border-cyan-500/50'
  );
};
