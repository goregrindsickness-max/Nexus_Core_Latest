import React from 'react';
import { HeaderMarqueeText } from '../social/timeline/utils';
import {
  resolveBandLogo,
  resolveBandCover,
  resolveBandHandle,
  resolveBandName,
  resolveBandBio,
  resolveBandLocation,
  resolveCreativeName,
  resolveCreativeHandle,
  resolveCreativeLogo,
  resolveCreativeCover,
  resolveCreativeBio,
  resolveCreativeLocation,
  resolvePromoterName,
  resolvePromoterHandle,
  resolvePromoterLogo,
  resolveEffectiveAvatar,
  resolveEffectiveCover,
} from '../../utils/bandProfileUtils';
import { isMiguelNameOrProfile } from '../social/utils/profileUtils';

export interface ProfileCommandBarProps {
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
  getRoleBorderAndGlowClass: (role?: string, profile?: any) => string;
  activeBand?: any;
  userProfile?: any;
}

export const ProfileCommandBar: React.FC<ProfileCommandBarProps> = ({
  activeTab,
  currentTheme,
  profileCoverUrl,
  isEmbedded = false,
  profileAvatarUrl,
  profileHandle,
  profileFullLegalName,
  portalRole = '',
  profileBlurb,
  profileLocation,
  getRoleBorderAndGlowClass,
  activeBand,
  userProfile,
}) => {
  const [liveAvatar, setLiveAvatar] = React.useState<string | null>(null);
  const [liveCover, setLiveCover] = React.useState<string | null>(null);
  const [avatarError, setAvatarError] = React.useState(false);

  React.useEffect(() => {
    const handleAvatarUpdated = (e: any) => {
      const newUrl = e.detail?.avatarUrl || e.detail?.avatar_url || e.detail?.avatar;
      if (newUrl) {
        setLiveAvatar(newUrl);
        setAvatarError(false);
      }
    };
    const handleCoverUpdated = (e: any) => {
      const newUrl = e.detail?.coverUrl || e.detail?.cover_url || e.detail?.banner_url || e.detail?.bannerUrl;
      if (newUrl) {
        setLiveCover(newUrl);
      }
    };

    window.addEventListener('nexus_avatar_updated', handleAvatarUpdated);
    window.addEventListener('nexus_cover_updated', handleCoverUpdated);

    return () => {
      window.removeEventListener('nexus_avatar_updated', handleAvatarUpdated);
      window.removeEventListener('nexus_cover_updated', handleCoverUpdated);
    };
  }, []);

  const baseAvatar = resolveEffectiveAvatar(portalRole, activeBand, userProfile, profileAvatarUrl);
  const baseCover = resolveEffectiveCover(portalRole, activeBand, userProfile, profileCoverUrl);

  const effectiveAvatar = liveAvatar || baseAvatar;
  const effectiveCover = liveCover || baseCover;
  const effectiveName = portalRole === 'band'
    ? resolveBandName(activeBand, userProfile)
    : portalRole === 'creative'
    ? resolveCreativeName(userProfile)
    : portalRole === 'promoter'
    ? resolvePromoterName(userProfile)
    : (profileFullLegalName || userProfile?.full_name || userProfile?.name || 'User');

  const resolvedPersonalHandle =
    profileHandle ||
    userProfile?.console_handle ||
    userProfile?.handle ||
    userProfile?.username ||
    'user';

  const effectiveHandle = portalRole === 'band'
    ? resolveBandHandle(activeBand, userProfile)
    : portalRole === 'creative'
    ? resolveCreativeHandle(userProfile)
    : portalRole === 'promoter'
    ? resolvePromoterHandle(userProfile)
    : resolvedPersonalHandle;

  React.useEffect(() => {
    setAvatarError(false);
  }, [effectiveAvatar]);

  const handleOpenPublicProfile = () => {
    if (typeof window === 'undefined') return;

    if (portalRole === 'band') {
      const bandName = resolveBandName(activeBand, userProfile);
      const bandHandle = resolveBandHandle(activeBand, userProfile);
      const normalizedHandle = bandHandle.startsWith('@') ? bandHandle : `@${bandHandle}`;
      const bandLogo = resolveBandLogo(activeBand, userProfile);
      const bandCover = resolveBandCover(activeBand, userProfile);
      const bandBio = resolveBandBio(activeBand, userProfile);
      const bandLocation = resolveBandLocation(activeBand, userProfile);

      window.dispatchEvent(
        new CustomEvent('openPublicProfile', {
          detail: {
            id: activeBand?.id || userProfile?.band_id || 'band:active',
            name: bandName,
            legalName: bandName,
            handle: normalizedHandle,
            console_handle: normalizedHandle,
            username: normalizedHandle,
            avatar: bandLogo,
            avatar_url: bandLogo,
            logo: bandLogo,
            logo_url: bandLogo,
            banner: bandCover,
            banner_url: bandCover,
            cover: bandCover,
            cover_url: bandCover,
            location: bandLocation,
            role: 'Band / Artist',
            account_type: 'band',
            type: 'band',
            isPersonal: false,
            isBandProfile: true,
            isYou: true,
            badges: ['⚡ Band Core', '🎵 Metal'],
            customBadges: ['⚡ Band Core', '🎵 Metal'],
            bio: bandBio,
          },
        })
      );
      return;
    }

    if (portalRole === 'promoter') {
      const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
      const pm = (userProfile as any)?.promoter_metadata || {};
      const promoterAgencyName =
        pm.brand_name ||
        pm.agency_name ||
        (userProfile as any)?.promoter_agency ||
        (isOwnerMiguel
          ? 'Nexus Live Productions'
          : userProfile?.name
          ? `${userProfile.name} Productions`
          : 'Promoter Operations');
      const promoterLogo = resolvePromoterLogo(userProfile);
      const promoterCover =
        (typeof window !== 'undefined' ? localStorage.getItem('nexus_promoter_cover') : null) ||
        pm.banner_url ||
        pm.cover_url ||
        (userProfile as any)?.promoter_cover_image ||
        (isOwnerMiguel
          ? 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635'
          : userProfile?.promoter_cover_image || '');
      const promoterBio =
        pm.bio ||
        (userProfile as any)?.promoter_bio ||
        (typeof window !== 'undefined' ? localStorage.getItem('nexus_promoter_bio') : null) ||
        (isOwnerMiguel
          ? 'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.'
          : 'Independent live event promoter.');
      const rawHandle =
        (userProfile as any)?.promoter_handle ||
        (promoterAgencyName
          ? `@${promoterAgencyName.replace(/\s+/g, '')}`
          : isOwnerMiguel
          ? '@NexusLive'
          : '@promoter');
      const resolvedHandle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;

      window.dispatchEvent(
        new CustomEvent('openPublicProfile', {
          detail: {
            id:
              userProfile?.id ||
              (userProfile as any)?.promoter_id ||
              (isOwnerMiguel ? '5403162d-1947-43aa-b5f6-38a1bd2a1b80' : 'promoter_profile'),
            user_id: userProfile?.id || (isOwnerMiguel ? '5403162d-1947-43aa-b5f6-38a1bd2a1b80' : 'promoter_profile'),
            email: userProfile?.email || (isOwnerMiguel ? 'goregrindsickness@gmail.com' : ''),
            name: promoterAgencyName,
            legalName: userProfile?.full_name || userProfile?.name || (isOwnerMiguel ? 'Miguel Goregrinder Medina' : 'Promoter User'),
            full_name: userProfile?.full_name || userProfile?.name || (isOwnerMiguel ? 'Miguel Goregrinder Medina' : 'Promoter User'),
            handle: resolvedHandle,
            console_handle: resolvedHandle,
            username: resolvedHandle,
            avatar: promoterLogo,
            avatar_url: promoterLogo,
            logo: promoterLogo,
            logo_url: promoterLogo,
            promoter_logo: promoterLogo,
            banner: promoterCover,
            banner_url: promoterCover,
            cover: promoterCover,
            cover_url: promoterCover,
            promoter_cover_image: promoterCover,
            location: userProfile?.city ? `${userProfile.city}, ${userProfile.state || 'TX'}` : 'Denison, TX',
            role: 'Event Promoter',
            account_type: 'promoter',
            type: 'promoter',
            isPersonal: false,
            isPromoterProfile: true,
            isBandProfile: false,
            isYou: true,
            badges: ['🎪 Event Promoter', '⚡ Nexus Live'],
            customBadges: ['🎪 Event Promoter', '⚡ Nexus Live'],
            bio: promoterBio,
            promoter_metadata: pm,
          },
        })
      );
      return;
    }

    if (portalRole === 'creative') {
      const creativeName = resolveCreativeName(userProfile);
      const creativeAvatar = resolveCreativeLogo(userProfile);
      const creativeBanner = resolveCreativeCover(userProfile);
      const creativeBio = resolveCreativeBio(userProfile);
      const creativeHandle = resolveCreativeHandle(userProfile);
      const normalizedHandle = creativeHandle.startsWith('@') ? creativeHandle : `@${creativeHandle}`;
      const creativeLoc = resolveCreativeLocation(userProfile);

      window.dispatchEvent(
        new CustomEvent('openPublicProfile', {
          detail: {
            id: (userProfile as any)?.creative_id || userProfile?.id || 'creative:vortex',
            name: creativeName,
            legalName: userProfile?.full_name || userProfile?.name,
            business_name: creativeName,
            handle: normalizedHandle,
            console_handle: normalizedHandle,
            username: normalizedHandle,
            avatar: creativeAvatar,
            avatar_url: creativeAvatar,
            banner: creativeBanner,
            banner_url: creativeBanner,
            cover_url: creativeBanner,
            location: creativeLoc || userProfile?.location || 'Denison, Texas',
            role: 'Creative',
            account_type: 'creative',
            type: 'creative',
            isPersonal: false,
            isCreativeProfile: true,
            isBandProfile: false,
            isYou: true,
            badges: ['🛠️ Creative Pro', '🎨 Designer'],
            customBadges: ['🛠️ Creative Pro', '🎨 Designer'],
            bio: creativeBio,
            creative_metadata: (userProfile as any)?.creative_metadata || {},
          },
        })
      );
      return;
    }

    if (portalRole === 'label') {
      const labelName = (userProfile as any)?.label_name || (userProfile as any)?.label_metadata?.label_name || 'Rotten Music Records';
      const labelAvatar =
        (userProfile as any)?.label_avatar ||
        (userProfile as any)?.label_metadata?.logo_url ||
        userProfile?.avatar_url ||
        'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150';
      const labelBanner =
        (userProfile as any)?.label_banner ||
        (userProfile as any)?.label_metadata?.banner_url ||
        userProfile?.banner_url ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200';
      const labelBio =
        (userProfile as any)?.label_metadata?.bio ||
        userProfile?.bio ||
        'Independent record label dedicated to underground extreme metal releases.';
      const rawLabelHandle = (userProfile as any)?.label_handle || '@rottenmusic';
      const labelHandle = rawLabelHandle.startsWith('@') ? rawLabelHandle : `@${rawLabelHandle}`;

      window.dispatchEvent(
        new CustomEvent('openPublicProfile', {
          detail: {
            id: (userProfile as any)?.label_id || userProfile?.id || 'label:rotten',
            name: labelName,
            legalName: labelName,
            handle: labelHandle,
            console_handle: labelHandle,
            username: labelHandle,
            avatar: labelAvatar,
            avatar_url: labelAvatar,
            banner: labelBanner,
            banner_url: labelBanner,
            cover_url: labelBanner,
            location: userProfile?.location || 'USA / Global',
            role: 'Record Label',
            account_type: 'label',
            type: 'label',
            isPersonal: false,
            isLabelProfile: true,
            isBandProfile: false,
            isYou: true,
            badges: ['💿 Record Label'],
            customBadges: ['💿 Record Label'],
            bio: labelBio,
            label_metadata: (userProfile as any)?.label_metadata || {},
          },
        })
      );
      return;
    }

    const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
    const rawPersonalHandle =
      userProfile?.console_handle ||
      userProfile?.handle ||
      userProfile?.username ||
      userProfile?.screen_name ||
      profileHandle ||
      (userProfile?.name && !userProfile.name.toLowerCase().includes('miguel')
        ? userProfile.name.replace(/\s+/g, '_').toLowerCase()
        : userProfile?.email
        ? userProfile.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')
        : isOwnerMiguel
        ? 'bdmCEO'
        : 'member');
    const personalHandle =
      rawPersonalHandle &&
      (!rawPersonalHandle.toLowerCase().includes('virulent') || isOwnerMiguel) &&
      (!rawPersonalHandle.toLowerCase().includes('bdmceo') || isOwnerMiguel) &&
      rawPersonalHandle !== '@user' &&
      rawPersonalHandle !== 'user'
        ? rawPersonalHandle.startsWith('@')
          ? rawPersonalHandle
          : `@${rawPersonalHandle}`
        : isOwnerMiguel
        ? '@bdmCEO'
        : userProfile?.name
        ? `@${userProfile.name.replace(/\s+/g, '_').toLowerCase()}`
        : userProfile?.email
        ? `@${userProfile.email.split('@')[0]}`
        : '@member';

    const rawPersonalBanner =
      userProfile?.banner_url ||
      (typeof window !== 'undefined' ? localStorage.getItem('nexus_user_banner') : null) ||
      profileCoverUrl ||
      null;
    const cleanPersonalBanner =
      typeof rawPersonalBanner === 'string' && rawPersonalBanner.includes('promoter-banner')
        ? null
        : rawPersonalBanner;

    const authenticName =
      profileFullLegalName ||
      userProfile?.full_name ||
      userProfile?.name ||
      (isOwnerMiguel ? 'Miguel Goregrinder Medina' : userProfile?.email ? userProfile.email.split('@')[0] : 'Member');

    window.dispatchEvent(
      new CustomEvent('openPublicProfile', {
        detail: {
          id: userProfile?.id || null,
          name: authenticName,
          legalName: authenticName,
          handle: personalHandle,
          console_handle: personalHandle,
          username: personalHandle,
          avatar: effectiveAvatar || userProfile?.avatar_url || null,
          avatar_url: effectiveAvatar || userProfile?.avatar_url || null,
          banner: cleanPersonalBanner,
          banner_url: cleanPersonalBanner,
          cover_url: cleanPersonalBanner,
          location: profileLocation || userProfile?.location || 'USA / Global',
          role: userProfile?.account_type === 'fan_only' ? 'Fan Listener' : 'Industry Pro',
          account_type: userProfile?.account_type || 'industry_pro',
          type: 'user',
          isPersonal: true,
          isBandProfile: false,
          isYou: true,
          badges: userProfile?.badges || (userProfile?.account_type === 'fan_only' ? ['🤘 Fan'] : ['💼 Industry Pro']),
          customBadges: userProfile?.customBadges || userProfile?.badges || [],
          bio: profileBlurb || userProfile?.bio || userProfile?.blurb || 'User profile on the Nexus network.',
        },
      })
    );
  };

  if (activeTab !== 'feed') return null;

  const cleanHandle = (effectiveHandle || 'user').replace(/^@+/, '');
  const isProRole = ['band', 'creative', 'promoter', 'label'].includes(portalRole) || isEmbedded;
  const isFanRole = portalRole === 'fan_only' || portalRole === 'fan';
  const primaryName = isProRole ? (effectiveName || cleanHandle) : (effectiveName || `@${cleanHandle}`);
  const secondaryText = isProRole
    ? `@${cleanHandle} • ${portalRole.toUpperCase()} PRO`
    : isFanRole
    ? `@${cleanHandle} • FAN LISTENER`
    : `@${cleanHandle} • INDUSTRY PRO`;

  return (
    <div className="px-4 sm:px-0 pb-3 pt-1 flex justify-center shrink-0">
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenPublicProfile}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenPublicProfile();
          }
        }}
        className={`w-full max-w-[344px] sm:max-w-2xl h-[80px] sm:h-[84px] bg-[#06060b] border border-violet-500/45 hover:border-teal-400/75 rounded-2xl overflow-hidden shadow-[0_0_24px_rgba(109,40,217,0.32),0_0_16px_rgba(20,184,166,0.18)] ${currentTheme?.hoverBorderClass || ''} relative group cursor-pointer transition-all duration-300`}
      >
        {/* Subtle darkened banner background texture */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          {effectiveCover ? (
            <img
              src={effectiveCover}
              className="w-full h-full object-cover opacity-35 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500"
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-950/55 via-[#090812] to-teal-950/45" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#05050a]/92 via-[#070710]/75 to-[#050b10]/92" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(139,92,246,0.18),transparent_55%),radial-gradient(ellipse_at_right,rgba(20,184,166,0.16),transparent_55%)]" />
        </div>

        {/* Compact Horizontal Command Bar Contents */}
        <div className="relative z-10 h-full px-3 sm:px-5 flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Glowing Avatar + Display Name + @handle • Role */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center font-black ${currentTheme?.textClass || 'text-violet-400'} text-sm sm:text-base shrink-0 transition-transform duration-300 group-hover:scale-105 ${getRoleBorderAndGlowClass(
                userProfile?.active_workspace === 'band' ? 'band' : portalRole || userProfile?.active_workspace,
                userProfile
              )}`}
            >
              {effectiveAvatar && !avatarError ? (
                <img
                  src={effectiveAvatar}
                  className="w-full h-full object-cover"
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                (() => {
                  const cleanName = (
                    effectiveName && effectiveName !== 'User'
                      ? effectiveName
                      : userProfile?.full_name || userProfile?.name || 'User'
                  )
                    .replace(/^@+/, '')
                    .trim();
                  const parts = cleanName.split(/\s+/).filter(Boolean);
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[1][0]).toUpperCase();
                  }
                  return cleanName.slice(0, 2).toUpperCase() || 'U';
                })()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <HeaderMarqueeText className="min-w-0">
                <h3 className="text-sm sm:text-[15px] font-black text-white font-display tracking-tight leading-tight">
                  {primaryName}
                </h3>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isProRole && currentTheme?.textClass
                      ? currentTheme.textClass.replace('text-', 'bg-')
                      : 'bg-teal-400'
                  } animate-pulse`}
                />
              </HeaderMarqueeText>
              <p className="text-[10px] sm:text-[11px] text-zinc-300/90 font-mono tracking-wider uppercase truncate leading-tight mt-0.5">
                {secondaryText}
              </p>
            </div>
          </div>

          {/* Right: Direct Public Profile CTA Pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPublicProfile();
            }}
            className="shrink-0 inline-flex items-center justify-center rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-wide text-white bg-zinc-950/90 hover:bg-violet-950/90 border border-teal-400/55 hover:border-teal-300 shadow-[0_0_14px_rgba(20,184,166,0.22),0_0_14px_rgba(139,92,246,0.25)] transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>View Profile</span>
          </button>
        </div>

        {/* Bottom Purple/Teal Accent Hairline */}
        <div
          className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r ${
            currentTheme?.stripClass && portalRole && !['industry_pro', ''].includes(portalRole)
              ? currentTheme.stripClass
              : 'from-violet-600/85 via-teal-400/80 to-purple-600/85'
          } pointer-events-none`}
        />
      </div>
    </div>
  );
};

export default ProfileCommandBar;
