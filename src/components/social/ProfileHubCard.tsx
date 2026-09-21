import React from 'react';
import { Crown } from 'lucide-react';
import {
  resolveBandLogo,
  resolveBandCover,
  resolveBandHandle,
  resolveBandName,
  resolveEffectiveAvatar,
  resolveEffectiveCover
} from '../../utils/bandProfileUtils';

interface ProfileHubCardProps {
  activeTab: string;
  setLeftDrawerOpen: (open: boolean) => void;
  setDrawerCurrentView: (view: string) => void;
  triggerNotification?: (msg: string) => void;
  currentTheme: any;
  profileCoverUrl?: string;
  isEmbedded?: boolean;
  profileAvatarUrl?: string;
  profileHandle?: string;
  profileFullLegalName?: string;
  portalRole?: string;
  profileBlurb?: string;
  profileSceneRoles?: string[];
  profileLocation?: string;
  getRoleBorderAndGlowClass: (role?: string) => string;
  activeBand?: any;
  userProfile?: any;
}

export const ProfileHubCard: React.FC<ProfileHubCardProps> = ({
  activeTab,
  setLeftDrawerOpen,
  setDrawerCurrentView,
  triggerNotification,
  currentTheme,
  profileCoverUrl,
  isEmbedded = false,
  profileAvatarUrl,
  profileHandle,
  profileFullLegalName,
  portalRole = '',
  profileBlurb,
  profileSceneRoles = [],
  profileLocation,
  getRoleBorderAndGlowClass,
  activeBand,
  userProfile,
}) => {
  if (activeTab !== 'feed') return null;

  const effectiveAvatar = resolveEffectiveAvatar(portalRole, activeBand, userProfile, profileAvatarUrl);
  const effectiveCover = resolveEffectiveCover(portalRole, activeBand, userProfile, profileCoverUrl);
  const effectiveName = portalRole === 'band' ? resolveBandName(activeBand, userProfile) : (profileFullLegalName || 'User');
  const effectiveHandle = portalRole === 'band' ? resolveBandHandle(activeBand, userProfile) : (profileHandle || 'user');

  return (
    <div className="px-4 sm:px-0 pb-4 flex justify-center shrink-0">
      <div
        onClick={() => {
          setLeftDrawerOpen(true);
          setDrawerCurrentView('profile');
          triggerNotification?.('Opening Profile Settings...');
        }}
        className={`w-full max-w-[344px] sm:max-w-2xl bg-[#050608] ${currentTheme.hoverBorderClass} border border-zinc-900 sm:rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.85)] relative group cursor-pointer transition-all duration-300 hover:scale-[1.01]`}
      >
        {/* Cover Image Background covering the entire card */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          {effectiveCover ? (
            <img src={effectiveCover} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-rose-950/40 to-purple-950/40 relative">
              {/* Subtle red grid pattern overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(239,68,68,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.12)_1px,transparent_1px)] [background-size:12px_12px]" />
            </div>
          )}
          {/* Overlay with radial fade to black to guarantee text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-black/90" />
          {/* Edit overlay prompt on hover */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250 z-10">
            <span className="text-[9px] font-black uppercase text-white tracking-widest font-mono bg-rose-600/90 px-3 py-1 rounded-full shadow-lg">
              Edit Profile
            </span>
          </div>
        </div>

        {/* Absolute PRO Badge in Upper Right Corner */}
        {isEmbedded && (
          <div className={`absolute top-3 right-3 z-20 ${currentTheme.bgBadge} text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1`}>
            <Crown className="w-2.5 h-2.5" />
            <span>PRO</span>
          </div>
        )}

        {/* Profile Content Container */}
        <div className="relative z-10 p-5 flex flex-col items-center text-center space-y-3">
          {/* Profile Avatar Overlap - Enlarged */}
          <div className={`w-[92px] h-[92px] rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center font-black ${currentTheme.textClass} text-2xl shrink-0 transition-transform duration-300 group-hover:scale-105 ${getRoleBorderAndGlowClass(portalRole)}`}>
            {effectiveAvatar ? (
              <img src={effectiveAvatar} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              (effectiveHandle || effectiveName || 'U').replace(/^@+/, '').charAt(0).toUpperCase()
            )}
          </div>

          {/* Profile Handle & Full Name in a solid black pill style box */}
          {(() => {
            const cleanHandle = (effectiveHandle || 'user').replace(/^@+/, '');
            const isProRole = ['band', 'creative', 'promoter', 'label'].includes(portalRole) || isEmbedded;
            const primaryName = isProRole ? (effectiveName || cleanHandle) : (effectiveName || `@${cleanHandle}`);
            const secondaryText = isProRole 
              ? `@${cleanHandle} • ${portalRole.toUpperCase()} PRO`
              : (portalRole === 'industry_pro' ? `@${cleanHandle} • INDUSTRY PRO` : `@${cleanHandle} • FAN LISTENER`);

            return (
              <div className="bg-black/95 border border-zinc-900 rounded-2xl px-5 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.8)] inline-flex flex-col items-center max-w-full">
                <h3 className="text-sm font-black text-white font-display tracking-tight flex items-center justify-center gap-1.5">
                  {primaryName}
                  <span className={`w-1.5 h-1.5 rounded-full ${isProRole ? currentTheme.textClass.replace('text-', 'bg-') : 'bg-rose-500'} animate-pulse`} />
                </h3>
                <p className="text-[8px] text-zinc-400 font-mono tracking-wider uppercase leading-none mt-1">
                  {secondaryText}
                </p>
              </div>
            );
          })()}

          {/* Profile Blurb inside a solid black pill style box */}
          {profileBlurb && (
            <div className="bg-black/95 border border-zinc-900 rounded-full px-4 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.8)] max-w-full">
              <p className="text-[9px] text-zinc-300 italic font-mono leading-tight truncate px-1">
                "{profileBlurb}"
              </p>
            </div>
          )}

          {/* Badges / Scene Roles & Location inside solid black pill style box */}
          <div className="bg-black/95 border border-zinc-900 rounded-full px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.8)] flex flex-wrap gap-1.5 justify-center max-w-full">
            {profileSceneRoles.filter(role => portalRole !== 'label' || (role !== 'Musician' && role !== 'Artist')).map((role, roleIdx) => (
              <span key={`scene-role-${role}-${roleIdx}`} className={`text-[7px] font-mono font-black uppercase tracking-wider ${currentTheme.bgBadge} px-1.5 py-0.5 rounded-full`}>
                {role}
              </span>
            ))}
            {profileLocation && (
              <span className="text-[7px] font-mono font-black uppercase tracking-wider bg-zinc-900/60 border border-zinc-850 text-zinc-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                📍 {profileLocation}
              </span>
            )}
          </div>
        </div>

        {/* Status Indicator Strip at bottom */}
        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${currentTheme.stripClass}`} />
      </div>
    </div>
  );
};
