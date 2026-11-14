import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { handleImageErrorWithCache } from '../../../services/profileImageCacheService';
import {
  resolveBandLogo,
  resolveBandHandle,
  resolveBandName,
  resolvePromoterName,
  resolvePromoterHandle,
  resolvePromoterLogo,
  resolveCreativeName,
  resolveCreativeHandle,
  resolveCreativeLogo,
} from '../../../utils/bandProfileUtils';
import { isMiguelNameOrProfile } from '../utils/profileUtils';

export interface WorkspaceEntityItem {
  id: string;
  name: string;
  handle: string;
  logoUrl?: string | null;
  subtitle?: string;
  rawEntity?: any;
}

export function buildWorkspaceEntityItems(
  workspaceType: 'band' | 'promoter' | 'creative' | 'label',
  options: {
    userProfile?: any;
    activeBand?: any;
    bands?: any[];
    managedEntities?: any[];
  }
): WorkspaceEntityItem[] {
  const { userProfile, activeBand, bands = [], managedEntities = [] } = options;
  const items: WorkspaceEntityItem[] = [];
  const seenNames = new Set<string>();

  const pushUnique = (item: WorkspaceEntityItem) => {
    const cleanName = String(item.name || '').trim();
    if (!cleanName) return;
    const key = cleanName.toLowerCase();
    if (seenNames.has(key)) return;
    seenNames.add(key);
    items.push({
      ...item,
      name: cleanName,
      handle: String(item.handle || cleanName.replace(/\s+/g, '_')).replace(/^@+/, ''),
    });
  };

  if (workspaceType === 'band') {
    const rawCandidates: any[] = [];
    if (Array.isArray(bands) && bands.length > 0) {
      rawCandidates.push(...bands);
    }
    if (Array.isArray(userProfile?.bands) && userProfile.bands.length > 0) {
      userProfile.bands.forEach((b: any) => {
        if (typeof b === 'string') {
          rawCandidates.push({ id: `band:${b}`, name: b });
        } else if (b && typeof b === 'object') {
          rawCandidates.push(b);
        }
      });
    }
    if (Array.isArray(managedEntities)) {
      managedEntities
        .filter((e: any) => e?.category === 'band')
        .forEach((e: any) => {
          rawCandidates.push({
            id: e.id,
            name: e.display_name,
            custom_slug: e.slug,
            logo_url: e.avatar_url,
            bio: e.bio,
            homebase: e.location,
          });
        });
    }
    if (activeBand && (activeBand.name || activeBand.band_name || activeBand.id)) {
      rawCandidates.push(activeBand);
    }

    rawCandidates.forEach((b, idx) => {
      const resolvedName = resolveBandName(b, userProfile);
      if (resolvedName && resolvedName !== 'Band / Artist') {
        pushUnique({
          id: String(b?.id || userProfile?.band_id || `band-${idx}`),
          name: resolvedName,
          handle: resolveBandHandle(b, userProfile),
          logoUrl: resolveBandLogo(b, userProfile),
          rawEntity: b,
        });
      }
    });

    if (items.length === 0) {
      const fallbackName = resolveBandName(activeBand, userProfile);
      pushUnique({
        id: String(activeBand?.id || userProfile?.band_id || 'band:active'),
        name: fallbackName,
        handle: resolveBandHandle(activeBand, userProfile),
        logoUrl: resolveBandLogo(activeBand, userProfile),
        rawEntity: activeBand || { id: userProfile?.band_id || 'band:active', name: fallbackName },
      });
    }

    return items;
  }

  if (workspaceType === 'promoter') {
    const primaryName =
      resolvePromoterName(userProfile) ||
      (userProfile?.name ? `${userProfile.name} Productions` : 'Promoter Operations');
    pushUnique({
      id: String(userProfile?.promoter_id || userProfile?.id || 'promoter:primary'),
      name: primaryName,
      handle: resolvePromoterHandle(userProfile),
      logoUrl: resolvePromoterLogo(userProfile),
      rawEntity: userProfile,
    });

    if (Array.isArray(userProfile?.promoter_entities)) {
      userProfile.promoter_entities.forEach((p: any, idx: number) => {
        if (!p) return;
        const pName = p.brand_name || p.agency_name || p.name || p.display_name;
        if (pName) {
          pushUnique({
            id: String(p.id || `promoter-${idx}`),
            name: pName,
            handle: p.handle || p.slug || pName.replace(/\s+/g, '_').toLowerCase(),
            logoUrl: p.logo_url || p.avatar_url || resolvePromoterLogo(userProfile),
            rawEntity: p,
          });
        }
      });
    }

    if (Array.isArray(managedEntities)) {
      managedEntities
        .filter((e: any) => e?.category === 'venue' || e?.category === 'booking_agency')
        .forEach((e: any) => {
          pushUnique({
            id: String(e.id),
            name: e.display_name,
            handle: e.slug,
            logoUrl: e.avatar_url,
            rawEntity: e,
          });
        });
    }

    return items;
  }

  if (workspaceType === 'creative') {
    const primaryName =
      resolveCreativeName(userProfile) ||
      (userProfile?.name ? `${userProfile.name} Studio` : 'Creative Studio');
    pushUnique({
      id: String(userProfile?.creative_id || userProfile?.id || 'creative:primary'),
      name: primaryName,
      handle: resolveCreativeHandle(userProfile) || primaryName.replace(/\s+/g, '_').toLowerCase(),
      logoUrl: resolveCreativeLogo(userProfile),
      rawEntity: userProfile,
    });

    if (Array.isArray(userProfile?.creative_entities)) {
      userProfile.creative_entities.forEach((c: any, idx: number) => {
        if (!c) return;
        const cName = c.business_name || c.creative_name || c.name || c.display_name;
        if (cName) {
          pushUnique({
            id: String(c.id || `creative-${idx}`),
            name: cName,
            handle: c.handle || c.slug || cName.replace(/\s+/g, '_').toLowerCase(),
            logoUrl: c.logo_url || c.avatar_url || resolveCreativeLogo(userProfile),
            rawEntity: c,
          });
        }
      });
    }

    return items;
  }

  if (workspaceType === 'label') {
    const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
    const primaryName =
      userProfile?.label_name ||
      userProfile?.label_company_name ||
      userProfile?.label_metadata?.label_name ||
      (isOwnerMiguel ? 'Rotten Music Records' : 'Record Label');
    const primaryHandle =
      userProfile?.label_handle ||
      userProfile?.label_url_slug ||
      userProfile?.label_metadata?.handle ||
      (isOwnerMiguel ? 'rottenmusic' : primaryName.replace(/\s+/g, '_').toLowerCase());
    const primaryLogo =
      userProfile?.label_avatar ||
      userProfile?.label_metadata?.logo_url ||
      userProfile?.avatar_url ||
      null;

    pushUnique({
      id: String(userProfile?.label_id || userProfile?.id || 'label:primary'),
      name: primaryName,
      handle: primaryHandle,
      logoUrl: primaryLogo,
      rawEntity: userProfile,
    });

    if (Array.isArray(userProfile?.label_entities)) {
      userProfile.label_entities.forEach((l: any, idx: number) => {
        if (!l) return;
        const lName = l.label_name || l.name || l.display_name;
        if (lName) {
          pushUnique({
            id: String(l.id || `label-${idx}`),
            name: lName,
            handle: l.handle || l.slug || lName.replace(/\s+/g, '_').toLowerCase(),
            logoUrl: l.logo_url || l.avatar_url || primaryLogo,
            rawEntity: l,
          });
        }
      });
    }

    if (Array.isArray(managedEntities)) {
      managedEntities
        .filter((e: any) => e?.category === 'label')
        .forEach((e: any) => {
          pushUnique({
            id: String(e.id),
            name: e.display_name,
            handle: e.slug,
            logoUrl: e.avatar_url,
            rawEntity: e,
          });
        });
    }

    return items;
  }

  return items;
}

export interface SwipableWorkspaceEntityCardProps {
  workspaceType: 'band' | 'promoter' | 'creative' | 'label';
  entities: WorkspaceEntityItem[];
  activeEntityId?: string | null;
  isWorkspaceActive: boolean;
  onSelectEntity: (entity: WorkspaceEntityItem) => void;
}

const WORKSPACE_STYLE_META: Record<
  'band' | 'promoter' | 'creative' | 'label',
  {
    icon: string;
    typeLabel: string;
    activeBg: string;
    activeBorder: string;
    idleBg: string;
    idleBorder: string;
    accentText: string;
    dotClass: string;
    avatarBorder: string;
  }
> = {
  band: {
    icon: '🎸',
    typeLabel: 'BAND / ARTIST',
    activeBg: 'bg-gradient-to-r from-emerald-950/60 via-[#132a24]/70 to-zinc-900/90',
    activeBorder: 'border-[#00ffcc]/70 shadow-[0_0_14px_rgba(0,255,204,0.2)]',
    idleBg: 'bg-zinc-900/75 hover:bg-zinc-900',
    idleBorder: 'border-emerald-500/35 hover:border-[#00ffcc]/65',
    accentText: 'text-[#00ffcc]',
    dotClass: 'bg-[#00ffcc] shadow-[0_0_8px_rgba(0,255,204,0.85)]',
    avatarBorder: 'border-[#00ffcc]/50',
  },
  promoter: {
    icon: '🏟️',
    typeLabel: 'VENUE PROMOTER',
    activeBg: 'bg-gradient-to-r from-yellow-950/55 via-amber-950/40 to-zinc-900/90',
    activeBorder: 'border-yellow-400/75 shadow-[0_0_14px_rgba(234,179,8,0.2)]',
    idleBg: 'bg-zinc-900/75 hover:bg-zinc-900',
    idleBorder: 'border-yellow-500/35 hover:border-yellow-400/65',
    accentText: 'text-yellow-400',
    dotClass: 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.85)]',
    avatarBorder: 'border-yellow-400/50',
  },
  creative: {
    icon: '🛠️',
    typeLabel: 'CREATIVE HUB',
    activeBg: 'bg-gradient-to-r from-fuchsia-950/55 via-purple-950/45 to-zinc-900/90',
    activeBorder: 'border-fuchsia-400/75 shadow-[0_0_14px_rgba(217,70,239,0.2)]',
    idleBg: 'bg-zinc-900/75 hover:bg-zinc-900',
    idleBorder: 'border-fuchsia-500/35 hover:border-fuchsia-400/65',
    accentText: 'text-fuchsia-400',
    dotClass: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.85)]',
    avatarBorder: 'border-fuchsia-400/50',
  },
  label: {
    icon: '💿',
    typeLabel: 'RECORD LABEL',
    activeBg: 'bg-gradient-to-r from-orange-950/55 via-amber-950/45 to-zinc-900/90',
    activeBorder: 'border-orange-400/75 shadow-[0_0_14px_rgba(249,115,22,0.2)]',
    idleBg: 'bg-zinc-900/75 hover:bg-zinc-900',
    idleBorder: 'border-orange-500/35 hover:border-orange-400/65',
    accentText: 'text-orange-400',
    dotClass: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.85)]',
    avatarBorder: 'border-orange-400/50',
  },
};

export const SwipableWorkspaceEntityCard: React.FC<SwipableWorkspaceEntityCardProps> = ({
  workspaceType,
  entities,
  activeEntityId,
  isWorkspaceActive,
  onSelectEntity,
}) => {
  const meta = WORKSPACE_STYLE_META[workspaceType];
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (!activeEntityId || entities.length <= 1) return 0;
    const foundIdx = entities.findIndex(
      (e) => String(e.id).toLowerCase() === String(activeEntityId).toLowerCase()
    );
    return foundIdx >= 0 ? foundIdx : 0;
  });
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const didSwipeRef = useRef<boolean>(false);

  useEffect(() => {
    if (currentIndex >= entities.length) {
      setCurrentIndex(0);
    }
  }, [entities.length, currentIndex]);

  useEffect(() => {
    if (!activeEntityId || entities.length <= 1) return;
    const foundIdx = entities.findIndex(
      (e) => String(e.id).toLowerCase() === String(activeEntityId).toLowerCase()
    );
    if (foundIdx >= 0) {
      setCurrentIndex(foundIdx);
    }
  }, [activeEntityId, entities]);

  if (!entities || entities.length === 0) return null;

  const safeIndex = Math.min(currentIndex, entities.length - 1);
  const currentEntity = entities[safeIndex];
  const hasMultiple = entities.length > 1;

  const isThisEntityActive =
    isWorkspaceActive &&
    (!hasMultiple ||
      !activeEntityId ||
      String(currentEntity.id).toLowerCase() === String(activeEntityId).toLowerCase());

  const goPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + entities.length) % entities.length);
  };

  const goNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % entities.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultiple) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    didSwipeRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!hasMultiple || touchStartXRef.current === null) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    if (Math.abs(touchDeltaXRef.current) > 12) {
      didSwipeRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!hasMultiple || touchStartXRef.current === null) return;
    const delta = touchDeltaXRef.current;
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    if (Math.abs(delta) >= 35) {
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  const formattedHandle = currentEntity.handle.startsWith('@')
    ? currentEntity.handle
    : `@${currentEntity.handle}`;

  const initials =
    currentEntity.name
      .replace(/^@+/, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'W';

  const showImg = Boolean(currentEntity.logoUrl && !imgErrorMap[currentEntity.id]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        if (didSwipeRef.current) {
          didSwipeRef.current = false;
          return;
        }
        onSelectEntity(currentEntity);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectEntity(currentEntity);
        } else if (hasMultiple && e.key === 'ArrowLeft') {
          e.preventDefault();
          goPrev();
        } else if (hasMultiple && e.key === 'ArrowRight') {
          e.preventDefault();
          goNext();
        }
      }}
      className={`w-full rounded-xl p-2.5 border transition-all duration-200 cursor-pointer select-none group relative overflow-hidden ${
        isThisEntityActive
          ? `${meta.activeBg} ${meta.activeBorder} text-white`
          : `${meta.idleBg} ${meta.idleBorder} text-zinc-200`
      }`}
    >
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Entity Avatar/Logo + Name & Handle */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-lg bg-zinc-950 border ${meta.avatarBorder} overflow-hidden flex items-center justify-center shrink-0 shadow-sm`}
          >
            {showImg ? (
              <img
                src={currentEntity.logoUrl!}
                alt={currentEntity.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  handleImageErrorWithCache(e, currentEntity.logoUrl!, undefined)
                    .then(() => {
                      if (e.currentTarget.style.display === 'none') {
                        setImgErrorMap((prev) => ({ ...prev, [currentEntity.id]: true }));
                      }
                    })
                    .catch(() => {
                      setImgErrorMap((prev) => ({ ...prev, [currentEntity.id]: true }));
                    });
                }}
              />
            ) : (
              <span className={`text-xs font-black font-mono ${meta.accentText}`}>{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] leading-none">{meta.icon}</span>
              <span className={`text-[8.5px] font-mono font-black uppercase tracking-wider ${meta.accentText}`}>
                {meta.typeLabel}
              </span>
              {hasMultiple && (
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-950/80 border border-zinc-700/80 text-[8px] font-mono font-bold text-zinc-300">
                  {safeIndex + 1}/{entities.length} • SWIPE
                </span>
              )}
            </div>
            <div className="text-xs font-black text-white tracking-tight truncate mt-0.5 group-hover:text-teal-200 transition-colors">
              {currentEntity.name}
            </div>
            <div className="text-[9px] font-mono text-zinc-400 truncate leading-none mt-0.5">
              {formattedHandle} • {isThisEntityActive ? 'Active Environment' : 'Tap to Switch'}
            </div>
          </div>
        </div>

        {/* Right: Swipe Controls (if multiple) + Active Dot / Switch Arrow */}
        <div className="flex items-center gap-1 shrink-0">
          {hasMultiple && (
            <div className="flex items-center gap-0.5 mr-0.5">
              <button
                type="button"
                onClick={goPrev}
                title="Previous workspace"
                aria-label="Previous workspace"
                className="w-5 h-5 rounded-md bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={goNext}
                title="Next workspace"
                aria-label="Next workspace"
                className="w-5 h-5 rounded-md bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {isThisEntityActive ? (
            <div className={`w-2 h-2 rounded-full ${meta.dotClass} shrink-0`} />
          ) : (
            <div className="w-6 h-6 rounded-full bg-zinc-950/70 group-hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-colors">
              <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Pagination Dots when user has multiple entities of the same workspace type */}
      {hasMultiple && (
        <div className="flex items-center justify-center gap-1.5 mt-2 pt-1.5 border-t border-zinc-800/60">
          {entities.map((ent, idx) => (
            <button
              key={`dot-${ent.id}-${idx}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`View ${ent.name}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === safeIndex ? `w-4 ${meta.dotClass}` : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipableWorkspaceEntityCard;
