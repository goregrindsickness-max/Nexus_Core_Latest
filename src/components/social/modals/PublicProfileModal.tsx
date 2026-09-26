import React from 'react';
import { ProfileCard as BandProfileCard } from '../../portals/Band/ProfileCard';
import { ProfileCard as CreativeProfileCard } from '../../portals/Creative/ProfileCard';
import { ProfileCard as LabelProfileCard } from '../../portals/Label/ProfileCard';
import { ProfileCard as PromoterProfileCard } from '../../portals/Promoter/ProfileCard';
import { CheckCircle, MapPin } from 'lucide-react';
import { SonicFootprint } from '../../profile/SonicFootprint';
import { formatLocationDisplay } from '../../../constants/location';
import { useUserPresence } from '../../../lib/presence';

// Keep ListenerMetric exports
export type { ListenerMetric } from '../../profile/SonicFootprint';
export { calculateListenerMetrics } from '../../profile/SonicFootprint';

export interface ProfileCardProps {
  profile?: any;
  onActionClick?: (actionLabel: string, metricId: string) => void;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onActionClick, className = '' }) => {
  const name = profile?.name || profile?.full_name || 'Underground Listener';
  const role = profile?.role || profile?.account_type || 'Fan Listener';
  const location = formatLocationDisplay(profile) || profile?.location || profile?.homebase || 'Global Scene';
  const avatar = profile?.avatar_url || profile?.avatar || name.slice(0, 2).toUpperCase();

  const userPresence = useUserPresence(profile?.id || profile?.email || profile?.handle || profile?.name);
  const isOnline = profile?.isYou || userPresence?.isOnline || userPresence?.formatted?.statusType === 'online';
  const isRecentlyActive = userPresence?.formatted?.isRecentlyActive || userPresence?.formatted?.statusType === 'recent';

  const r = (profile?.role || profile?.account_type || profile?.portalRole || profile?.type || '').toLowerCase();
  const rawRole = (profile?.role || profile?.account_type || profile?.portalRole || profile?.type || '').toUpperCase();
  const authorName = (profile?.name || profile?.band_name || '').toLowerCase();
  
  const isBand = profile?.isBandProfile === true ||
    r === 'band' ||
    r === 'artist' ||
    r.includes('band') ||
    r.includes('brutal') ||
    r.includes('slam') ||
    r.includes('deathcore') ||
    r.includes('metal') ||
    authorName.includes('virulent excision');

  const isLabel = !isBand && (
    profile?.isLabelProfile === true ||
    r === 'label' ||
    r.includes('label') ||
    r.includes('records')
  );

  const isCreative = !isBand && !isLabel && (
    profile?.isCreativeProfile === true ||
    r.includes('creative') ||
    r.includes('graphic') ||
    r.includes('design') ||
    r.includes('photographer') ||
    r.includes('videographer')
  );

  const isPromoter = !isBand && !isLabel && !isCreative && (
    profile?.isPromoterProfile === true ||
    r.includes('promoter') ||
    r.includes('venue') ||
    r.includes('booking')
  );

  const isIndustry = !isBand && !isLabel && !isCreative && !isPromoter && (
    r.includes('industry') ||
    r === 'pro' ||
    r === 'manager' ||
    r === 'executive'
  );

  const roleColorHex = isBand ? '#39ff14' : isLabel ? '#ff6b00' : isCreative ? '#ff00aa' : isPromoter ? '#ffff00' : isIndustry ? '#8b5cf6' : '#00f0ff';

  const isPersonal = profile?.isIndustryProPersonal === true || 
    profile?.isPersonal === true || 
    profile?.isYou === true || 
    (profile?.email && String(profile.email).includes('goregrindsickness')) || 
    (profile?.name && String(profile.name).toLowerCase().includes('miguel'));

  const isWorkspace = !isPersonal && (isBand || isLabel || isCreative || isPromoter);

  return (
    <div className={`bg-zinc-950 border border-zinc-900 rounded-3xl p-4 sm:p-5 space-y-5 shadow-2xl ${className}`}>
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0 group/avatar">
          {/* Micro glow border ring - static stroke + atmospheric glow */}
          <div 
            className="relative p-[2.5px] rounded-full transition-transform duration-200 group-hover/avatar:scale-105"
            style={{
              backgroundColor: roleColorHex,
              boxShadow: `0 0 16px ${roleColorHex}88, 0 0 28px ${roleColorHex}33`
            }}
          >
            <div className="w-20 h-20 rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center border border-zinc-950">
              {typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:')) ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center font-mono font-black text-xl" style={{ color: roleColorHex }}>
                  {avatar || (name ? name.slice(0, 2).toUpperCase() : 'U')}
                </div>
              )}
            </div>

            {/* Live Online Status Indicator */}
            <div 
              className="absolute bottom-0 right-0 z-30 flex items-center justify-center pointer-events-none"
              title={profile?.isYou ? "Online (You)" : isOnline ? "Online Now" : isRecentlyActive ? "Recently Active" : "Offline"}
            >
              <span className="relative flex h-3.5 w-3.5">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-zinc-950 ${
                  isOnline
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.95)] ring-1 ring-emerald-400/60'
                    : isRecentlyActive
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] ring-1 ring-amber-400/50'
                    : 'bg-zinc-600 shadow-[0_0_6px_rgba(0,0,0,0.6)]'
                }`} />
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-base font-black text-white tracking-tight font-display truncate">{name}</h2>
            <CheckCircle className="w-4 h-4 shrink-0" style={{ color: roleColorHex }} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-zinc-400 flex-wrap">
            <span 
              className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border"
              style={{
                backgroundColor: `${roleColorHex}15`,
                borderColor: `${roleColorHex}40`,
                color: roleColorHex
              }}
            >
              {role}
            </span>
            <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
              <MapPin className="w-3 h-3 text-rose-400" />
              {location}
            </span>
          </div>
        </div>
      </div>

      {/* Sonic Footprint & Listener Metrics - ONLY on user accounts, not on any workspace profiles */}
      {!isWorkspace && (
        <SonicFootprint profile={profile} onActionClick={onActionClick} />
      )}
    </div>
  );
};



export interface PublicProfileModalProps {
  selectedUserProfile: any;
  setSelectedUserProfile: React.Dispatch<React.SetStateAction<any>>;
  onBackProfile?: () => void;
  profileHistory?: any[];
  targetProfile: any;
  userProfile: any;
  setUserProfile?: React.Dispatch<React.SetStateAction<any>>;
  portalRole?: string;
  profileActiveTab: string;
  setProfileActiveTab: (tab: string) => void;
  triggerPictureViewer?: (data: any) => void;
  triggerNotification?: (msg: string) => void;
  allProfiles?: any[];
  handleFollowProfile?: (name: any, forceAction?: 'follow' | 'unfollow') => void;
  setViewingFollowersOrFollowing?: (val: 'followers' | 'following' | null) => void;
  openFloatingChat?: (id: string, obj: any) => void;
  bandJoinRequests?: any[];
  setBandJoinRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  setLeftDrawerOpen?: (val: boolean) => void;
  setDrawerCurrentView?: (view: string) => void;
  openCheckout?: (type: string, item: any) => void;
  setShowReportModal?: (val: boolean) => void;
  setShowSubmitEpkModal?: (val: boolean) => void;
  setShowAddItemModal?: (val: boolean) => void;
  setShopBrandFilter?: (brand: string) => void;
  setSecondaryUserProfile?: (user: any) => void;
  setActiveTab?: (tab: any) => void;
  profileBlurb: string;
  setProfileBlurb: (val: string) => void;
  saveProfileData: (notify?: boolean) => void;
  labelRosterTicker?: string;
  profilePrimaryGenres?: string[];
  profileMicroGenres?: string[];
  profileGenres?: string[];
  profileTopSongArtist: string;
  setProfileTopSongArtist: (val: string) => void;
  profileTopSongTitle: string;
  setProfileTopSongTitle: (val: string) => void;
  setProfileFavoriteSong: (val: string) => void;
  setProfileTopSongUrl: (val: string) => void;
  rosterExpanded: boolean;
  setRosterExpanded: (val: boolean) => void;
  collectionTab: string;
  setCollectionTab: (tab: any) => void;
  myCollections: any[];
  collPlayerActiveId: string;
  setCollPlayerActiveId: (id: string) => void;
  collPlayerActiveTrackId: string;
  setCollPlayerActiveTrackId: (id: string) => void;
  collPlayerIsPlaying: boolean;
  setCollPlayerIsPlaying: (val: boolean) => void;
  setSelectedGalleryItem?: (item: any) => void;
  selectedLabelBand: string;
  setSelectedLabelBand: (band: string) => void;
  profileActivePlaybackTrackId: string | null;
  setProfileActivePlaybackTrackId: (id: string | null) => void;
  profileIsPlaying: boolean;
  setProfileIsPlaying: (val: boolean) => void;
  profilePlaybackProgress: number;
  setProfilePlaybackProgress: (val: number) => void;
  getProfileForUser: (userParam: any) => any;
  supabase?: any;
  liveProfileStats?: any;
  setLiveProfileStats?: React.Dispatch<React.SetStateAction<any>>;
  feed?: any[];
}



export const PublicProfileModal: React.FC<PublicProfileModalProps> = (props) => {
  const baseTarget = props.selectedUserProfile || props.targetProfile;
  if (!baseTarget) return null;
  
  const targetRole = (baseTarget?.role || baseTarget?.portalRole || baseTarget?.account_type || baseTarget?.type || '').toLowerCase();
  const isPersonal = baseTarget?.isIndustryProPersonal === true;

  if (baseTarget?.type === 'creative' || baseTarget?.account_type === 'creative' || baseTarget?.isCreativeProfile === true || targetRole === 'creative' || targetRole.includes('creative') || targetRole.includes('designer') || targetRole.includes('photographer') || targetRole.includes('videographer')) {
    return <CreativeProfileCard {...props} />;
  }

  if (baseTarget?.type === 'label' || baseTarget?.account_type === 'label' || baseTarget?.isLabelProfile === true || targetRole === 'label' || targetRole.includes('label')) {
    return <LabelProfileCard {...props} />;
  }

  const isPromoter = (
    baseTarget?.type === 'promoter' || 
    baseTarget?.account_type === 'promoter' || 
    baseTarget?.isPromoterProfile === true || 
    baseTarget?.is_promoter === true ||
    targetRole === 'promoter' || 
    targetRole.includes('promoter') || 
    targetRole.includes('venue') ||
    Boolean(baseTarget?.promoter_metadata) ||
    Boolean(baseTarget?.promoter_agency) ||
    (typeof baseTarget?.name === 'string' && (baseTarget.name.toLowerCase().includes('nexus live') || baseTarget.name.toLowerCase().includes('pure domination') || baseTarget.name.toLowerCase().includes('domination fest'))) ||
    (typeof baseTarget?.entity_name === 'string' && (baseTarget.entity_name.toLowerCase().includes('nexus live') || baseTarget.entity_name.toLowerCase().includes('pure domination') || baseTarget.entity_name.toLowerCase().includes('domination fest')))
  );

  if (isPromoter) {
    return <PromoterProfileCard {...props} />;
  }

  const isArtistOrBand = !isPersonal && !!(
    baseTarget?.isBandProfile === true ||
    baseTarget?.isBand === true ||
    baseTarget?.type === 'band' ||
    targetRole === 'band' ||
    (targetRole.includes('band') && !targetRole.includes('fan')) ||
    (targetRole.includes('artist') && !targetRole.includes('fan'))
  );

  if (isArtistOrBand) {
    return <BandProfileCard {...props} />;
  }
  
  // Default (Fan Only and Industry Pro Personal profile cards)
  return <BandProfileCard {...props} />;
};

export default PublicProfileModal;
