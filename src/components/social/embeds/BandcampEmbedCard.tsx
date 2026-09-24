import React, { useState, useEffect, useRef } from 'react';
import { Disc, ExternalLink, Music2, Loader2 } from 'lucide-react';
import { requestPauseSceneRadio } from '../utils/mediaPlaybackCoordinator';
import { resolveBandcampMetadata, formatBandcampEmbedDarkUrl, openBandcampLink, extractSlugMetadata, BandcampResolvedData } from '../../../utils/socialFeedUtils';
import { getSupabase } from '../../../supabase';

interface BandcampEmbedCardProps {
  post?: any;
  embedUrl?: string | null;
  title?: string;
  trackTitle?: string;
  artist?: string;
  pageUrl?: string;
  itemType?: 'track' | 'album' | 'unknown';
  compact?: boolean;
  artworkUrl?: string | null;
  variant?: 'feed' | 'timeline' | 'profile' | 'compact';
}

const AutoScrollText: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
}> = ({ children, className = '', title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [overflowAmount, setOverflowAmount] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const cWidth = containerRef.current.clientWidth;
        const sWidth = contentRef.current.scrollWidth;
        if (sWidth > cWidth + 2) {
          setIsOverflowing(true);
          setOverflowAmount(sWidth - cWidth + 18);
        } else {
          setIsOverflowing(false);
          setOverflowAmount(0);
        }
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 250);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children]);

  return (
    <div
      ref={containerRef}
      title={title}
      className={`relative overflow-hidden whitespace-nowrap min-w-0 ${className}`}
      style={{
        maskImage: isOverflowing
          ? 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)'
          : undefined,
        WebkitMaskImage: isOverflowing
          ? 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)'
          : undefined,
      }}
    >
      <div
        className="inline-block"
        style={
          isOverflowing
            ? {
                display: 'inline-block',
                animation: `bandcampMarqueeScroll ${Math.max(6, overflowAmount / 16)}s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate`,
                ['--marquee-scroll-offset' as any]: `-${overflowAmount}px`,
              }
            : undefined
        }
      >
        <span ref={contentRef} className="inline-block">
          {children}
        </span>
      </div>
    </div>
  );
};

export const BandcampEmbedCard: React.FC<BandcampEmbedCardProps> = ({
  post,
  embedUrl: directEmbedUrl,
  title: directTitle,
  trackTitle: directTrackTitle,
  artist: directArtist,
  pageUrl: directPageUrl,
  itemType: directItemType,
  compact = false,
  artworkUrl: directArtworkUrl,
  variant
}) => {
  const bData = post?.bandcampData || (post as any)?.bandcamp_data || (post as any)?.data?.bandcampData || (post as any)?.data?.bandcamp_data || {};
  const rawEmbedUrl = directEmbedUrl || 
    bData.embedUrl || 
    bData.embed_url || 
    post?.bandcampUrl || 
    (post as any)?.bandcamp_url || 
    (post as any)?.data?.bandcampUrl || 
    (post as any)?.data?.bandcamp_url || 
    (post?.mediaUrl && post.mediaUrl.includes('bandcamp.com') ? post.mediaUrl : null) || 
    ((post as any)?.media_url && (post as any).media_url.includes('bandcamp.com') ? (post as any).media_url : null) || 
    (post?.image_url && post.image_url.includes('bandcamp.com') ? post.image_url : null) || 
    (post?.image && post.image.includes('bandcamp.com') ? post.image : null);

  const [asyncResolved, setAsyncResolved] = useState<BandcampResolvedData | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [headerImgError, setHeaderImgError] = useState<boolean>(false);
  const [artImgError, setArtImgError] = useState<boolean>(false);
  const [fallbackImgError, setFallbackImgError] = useState<boolean>(false);

  // Check if we already have a pre-resolved embed URL from props or post data
  const knownEmbedUrl = directEmbedUrl || 
    bData.embedUrl || 
    bData.embed_url || 
    (rawEmbedUrl && rawEmbedUrl.includes('EmbeddedPlayer') ? rawEmbedUrl : null) ||
    (bData.trackId ? `https://bandcamp.com/EmbeddedPlayer/bgcol=000000/linkcol=06b6d4/v=2/track=${bData.trackId}/size=large/tracklist=false/artwork=small/transparent=true/` : null) ||
    (bData.albumId ? `https://bandcamp.com/EmbeddedPlayer/bgcol=000000/linkcol=06b6d4/v=2/album=${bData.albumId}/size=large/tracklist=false/artwork=small/transparent=true/` : null);

  const handleManualResolve = (overrideUrl?: string) => {
    const targetUrl = overrideUrl || rawEmbedUrl;
    if (!targetUrl || typeof targetUrl !== 'string') return;
    setIsResolving(true);

    resolveBandcampMetadata(targetUrl)
      .then((res) => {
        if (res && res.success && res.embedUrl) {
          setAsyncResolved(res);
          if (post?.id) {
            try {
              const supabase = getSupabase();
              if (supabase) {
                const existingData = (post as any)?.data || post || {};
                const updatedData = {
                  ...existingData,
                  bandcampData: res,
                  bandcamp_data: res,
                  bandcampUrl: res.pageUrl || targetUrl,
                  bandcamp_url: res.pageUrl || targetUrl,
                };
                Promise.resolve(supabase.from('nexus_posts').update({ data: updatedData }).eq('id', post.id)).catch(() => {});
              }
            } catch (e) {}
          }
        }
        setIsResolving(false);
      })
      .catch((err) => {
        console.warn('[BandcampEmbedCard] Async resolution error:', err);
        setIsResolving(false);
      });
  };

  // If knownEmbedUrl is missing and rawEmbedUrl is a standard link, resolve it
  useEffect(() => {
    if (knownEmbedUrl) return;
    if (!rawEmbedUrl || typeof rawEmbedUrl !== 'string') return;

    let isMounted = true;
    setIsResolving(true);

    // 1. First check if Supabase has fresh data for this post ID
    if (post?.id) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          Promise.resolve(
            supabase
              .from('nexus_posts')
              .select('data')
              .eq('id', post.id)
              .limit(1)
          )
            .then(({ data: rows }: any) => {
              if (isMounted && rows && rows[0]) {
                const rowData = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : (rows[0].data || {});
                const freshBData = rowData.bandcampData || rowData.bandcamp_data;
                if (freshBData && freshBData.embedUrl) {
                  setAsyncResolved(freshBData);
                  setIsResolving(false);
                  return;
                }
              }
            })
            .catch(() => {});
        }
      } catch (e) {}
    }

    resolveBandcampMetadata(rawEmbedUrl)
      .then((res) => {
        if (isMounted) {
          if (res && res.success && res.embedUrl) {
            setAsyncResolved(res);

            // Backfill Supabase if post was missing pre-resolved embedUrl
            if (post?.id && (!bData.embedUrl && !bData.embed_url)) {
              try {
                const supabase = getSupabase();
                if (supabase) {
                  const existingData = (post as any)?.data || post || {};
                  const updatedData = {
                    ...existingData,
                    bandcampData: res,
                    bandcamp_data: res,
                    bandcampUrl: res.pageUrl || rawEmbedUrl,
                    bandcamp_url: res.pageUrl || rawEmbedUrl,
                  };
                  Promise.resolve(supabase.from('nexus_posts').update({ data: updatedData }).eq('id', post.id)).catch(() => {});
                }
              } catch (e) {}
            }
          }
          setIsResolving(false);
        }
      })
      .catch((err) => {
        console.warn('[BandcampEmbedCard] Async resolution error:', err);
        if (isMounted) setIsResolving(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawEmbedUrl, post?.id, knownEmbedUrl]);

  const activeEmbedUrl = asyncResolved?.embedUrl || knownEmbedUrl || directEmbedUrl || bData.embedUrl || bData.embed_url || (rawEmbedUrl && rawEmbedUrl.includes('EmbeddedPlayer') ? rawEmbedUrl : null);
  
  const slugMeta = rawEmbedUrl && !rawEmbedUrl.includes('EmbeddedPlayer') ? extractSlugMetadata(rawEmbedUrl) : { artist: '', title: '', itemType: 'track' as const };

  const trackTitle = directTrackTitle || directTitle || asyncResolved?.title || bData.title || (post as any)?.songData?.title || (post as any)?.title || slugMeta.title || 'Bandcamp Release';
  const artistName = directArtist || asyncResolved?.artist || bData.artist || (post as any)?.songData?.band || slugMeta.artist || (post as any)?.author?.name || (post as any)?.authorName || '';
  const pageLink = directPageUrl || asyncResolved?.pageUrl || bData.pageUrl || bData.page_url || post?.mediaUrl || (post as any)?.media_url || (rawEmbedUrl && !rawEmbedUrl.includes('EmbeddedPlayer') ? rawEmbedUrl : null);
  const itemType = directItemType || asyncResolved?.itemType || bData.itemType || bData.item_type || slugMeta.itemType || (rawEmbedUrl?.includes('album=') ? 'album' : 'track');
  // Filter out web URLs that aren't actual image assets
  const isValidArtworkUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    const u = url.trim().toLowerCase();
    if (!u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('data:image/')) return false;
    // If it's a bandcamp webpage link (not the bcbits image CDN), don't treat it as an image
    if (u.includes('bandcamp.com') && !u.includes('bcbits.com')) return false;
    return true;
  };

  const rawCandidateArtwork = directArtworkUrl || 
    asyncResolved?.artwork || 
    (asyncResolved as any)?.artworkUrl || 
    bData.artwork || 
    bData.artworkUrl || 
    bData.artwork_url || 
    bData.imageUrl || 
    bData.image_url || 
    post?.imageUrl || 
    post?.image_url || 
    post?.image || 
    (post as any)?.songData?.cover || 
    (post as any)?.songData?.artwork || 
    (post as any)?.data?.artwork ||
    (post as any)?.data?.imageUrl ||
    (post as any)?.data?.image_url ||
    (post?.media_url && typeof post.media_url === 'string' && post.media_url.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) ? post.media_url : null) ||
    (post?.mediaUrl && typeof post.mediaUrl === 'string' && post.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) ? post.mediaUrl : null) ||
    null;

  const artworkUrl = isValidArtworkUrl(rawCandidateArtwork) ? rawCandidateArtwork : null;

  // Format the iframe embed src URL with pitch black background and cyan highlights
  let resolvedIframeSrc: string | null = null;
  if (activeEmbedUrl) {
    resolvedIframeSrc = formatBandcampEmbedDarkUrl(activeEmbedUrl);
  } else if (rawEmbedUrl) {
    if (rawEmbedUrl.includes('EmbeddedPlayer')) {
      resolvedIframeSrc = formatBandcampEmbedDarkUrl(rawEmbedUrl);
    } else {
      // Check if trackId or albumId is available
      const trackMatch = rawEmbedUrl.match(/track[=_](\d+)/i) || bData.trackId || bData.track_id;
      const albumMatch = rawEmbedUrl.match(/album[=_](\d+)/i) || bData.albumId || bData.album_id;
      if (trackMatch) {
        const tId = typeof trackMatch === 'string' ? trackMatch : trackMatch[1];
        resolvedIframeSrc = `https://bandcamp.com/EmbeddedPlayer/bgcol=000000/linkcol=06b6d4/v=2/track=${tId}/size=large/tracklist=false/artwork=small/transparent=true/`;
      } else if (albumMatch) {
        const aId = typeof albumMatch === 'string' ? albumMatch : albumMatch[1];
        resolvedIframeSrc = `https://bandcamp.com/EmbeddedPlayer/bgcol=000000/linkcol=06b6d4/v=2/album=${aId}/size=large/tracklist=false/artwork=small/transparent=true/`;
      }
    }
  }

  // Ensure iframe src has HTTPS protocol
  if (resolvedIframeSrc && resolvedIframeSrc.startsWith('http://')) {
    resolvedIframeSrc = resolvedIframeSrc.replace('http://', 'https://');
  }

  // Keep both feed and public profile card iframe at the exact standard 120px Bandcamp player height
  // so the player controls, play button, and scrubber track maintain the exact same clean, unobstructed proportions.
  const iframeHeight = '120px';
  const containerMinHeight = 'min-h-[120px]';

  const handleOpenLink = (url: string) => {
    try {
      window.dispatchEvent(
        new CustomEvent('nexus_bandcamp_support_clicked', {
          detail: { title: trackTitle, artist: artistName, url }
        })
      );
    } catch (_) {}
    openBandcampLink(url);
  };

  return (
    <div 
      className={`${compact ? 'my-2 rounded-xl border-cyan-500/30' : 'my-3 rounded-2xl border-cyan-500/40'} overflow-hidden border hover:border-cyan-400/60 bg-black shadow-[0_4px_25px_rgba(0,0,0,0.9),0_0_15px_rgba(6,182,212,0.1)] group/bandcamp transition-all duration-300 w-full max-w-full`}
      onMouseEnter={() => requestPauseSceneRadio('bandcamp_embed_hover')}
    >
      <style>{`
        @keyframes bandcampMarqueeScroll {
          0%, 15% {
            transform: translateX(0);
          }
          85%, 100% {
            transform: translateX(var(--marquee-scroll-offset, -30px));
          }
        }
      `}</style>

      {/* Header bar with Bandcamp branding and auto-scrolling metadata */}
      <div className={`${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2.5'} bg-gradient-to-r from-black via-zinc-950 to-[#02181f] border-b border-cyan-500/30 flex items-center justify-between gap-2.5`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.25)] overflow-hidden`}>
            {artworkUrl && !headerImgError ? (
              <img 
                src={artworkUrl} 
                alt={trackTitle} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={() => setHeaderImgError(true)}
              />
            ) : (
              <Disc className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-cyan-400 animate-spin`} style={{ animationDuration: '5s' }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-mono font-black uppercase tracking-wider text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]`}>
                BANDCAMP
              </span>
            </div>
            {trackTitle && (
              <AutoScrollText 
                title={`${trackTitle}${artistName ? ` by ${artistName}` : ''}`}
                className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-semibold text-zinc-100 leading-tight mt-0.5`}
              >
                <span>{trackTitle}</span>
                {artistName ? <span className="text-cyan-400/80 font-normal ml-1.5">— {artistName}</span> : ''}
              </AutoScrollText>
            )}
          </div>
        </div>

        {pageLink && (
          <button
            type="button"
            onClick={() => handleOpenLink(pageLink)}
            className={`flex items-center gap-1 ${compact ? 'px-2 py-0.5 text-[8.5px]' : 'px-2.5 py-1 text-[9px]'} rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 font-mono font-bold uppercase tracking-wider transition-all shrink-0 ml-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)] cursor-pointer`}
          >
            <span>BUY / SUPPORT</span>
            <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
          </button>
        )}
      </div>

      {/* Album Artwork Showcase on Top: same proportions, scaled down slightly when compact to fit public profile margins */}
      {artworkUrl && !artImgError && (
        <div 
          onClick={() => pageLink && handleOpenLink(pageLink)}
          className={`w-full relative bg-zinc-950 border-b border-cyan-500/30 overflow-hidden flex items-center justify-center ${compact ? 'max-h-[200px] sm:max-h-[240px]' : 'max-h-[340px] sm:max-h-[400px]'} group/art cursor-pointer`}
          title={pageLink ? "Open on Bandcamp" : undefined}
        >
          {/* Ambient blurred backdrop for atmospheric depth */}
          <div className="absolute inset-0 opacity-25 filter blur-lg scale-105 pointer-events-none">
            <img 
              src={artworkUrl} 
              alt={trackTitle} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Crisp, centered album artwork */}
          <img 
            src={artworkUrl} 
            alt={trackTitle} 
            className={`relative z-10 w-full ${compact ? 'max-h-[200px] sm:max-h-[240px]' : 'max-h-[340px] sm:max-h-[400px]'} object-contain mx-auto shadow-[0_4px_30px_rgba(0,0,0,0.85)] group-hover/art:scale-[1.01] transition-transform duration-300`} 
            referrerPolicy="no-referrer"
            onError={() => setArtImgError(true)}
          />
        </div>
      )}

      {/* Embed Player Iframe Container (Full width, 100% unobstructed) / Fallback */}
      <div className={`relative w-full bg-black ${containerMinHeight}`}>
        {resolvedIframeSrc && resolvedIframeSrc.includes('EmbeddedPlayer') ? (
          <div className="w-full bg-black relative">
            <iframe
              src={resolvedIframeSrc}
              title={trackTitle || "Bandcamp Player"}
              style={{ border: 0, width: '100%', height: iframeHeight, minHeight: iframeHeight }}
              seamless
              loading="eager"
              referrerPolicy="no-referrer"
              allow="autoplay; encrypted-media; fullscreen; clipboard-write; picture-in-picture; web-share"
              className="w-full relative z-10 block bg-black"
              onLoad={() => {
                try {
                  window.dispatchEvent(new CustomEvent('nexus_bandcamp_played', { detail: { title: trackTitle, artist: artistName } }));
                } catch (_) {}
              }}
            />
          </div>
        ) : isResolving ? (
          <div className="p-6 flex flex-col items-center justify-center gap-2 bg-black text-center border-t border-cyan-950/60">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="font-bold uppercase tracking-wider">RESOLVING BANDCAMP PLAYER...</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Connecting to audio stream and embed data</p>
          </div>
        ) : (
          <div 
            onClick={() => openBandcampLink(pageLink || rawEmbedUrl)}
            className={`${compact ? 'p-3 gap-2.5' : 'p-4 sm:p-5 gap-3.5'} flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-cyan-950/30 via-black to-zinc-950 border-t border-cyan-500/30 hover:border-cyan-400/80 transition-all cursor-pointer group/fallback`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)] overflow-hidden group-hover/fallback:scale-105 transition-transform`}>
                {artworkUrl && !fallbackImgError ? (
                  <img 
                    src={artworkUrl} 
                    alt={trackTitle} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={() => setFallbackImgError(true)}
                  />
                ) : (
                  <Music2 className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-cyan-400 animate-pulse`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-1.5 py-0.5 rounded ${compact ? 'text-[7.5px]' : 'text-[8px]'} font-mono font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40`}>
                    BANDCAMP RELEASE PREVIEW
                  </span>
                </div>
                <div className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold text-white truncate`}>
                  {trackTitle}
                </div>
                <div className={`${compact ? 'text-[9.5px]' : 'text-[10px]'} text-cyan-300/80 mt-0.5 truncate`}>
                  {artistName || 'Bandcamp Artist'}
                </div>
                <span className={`${compact ? 'text-[8.5px]' : 'text-[9px]'} font-mono text-cyan-400/60 mt-0.5 block truncate`}>
                  {pageLink || rawEmbedUrl || 'bandcamp.com'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mt-2 sm:mt-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualResolve();
                }}
                className={`${compact ? 'px-2.5 py-1.5 text-[10.5px]' : 'px-3 py-2 text-xs'} rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-cyan-200 font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.2)]`}
                title="Force reload player embed"
              >
                <Loader2 className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                <span>Load Player</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openBandcampLink(pageLink || rawEmbedUrl);
                }}
                className={`${compact ? 'px-3 py-1.5 text-[10.5px]' : 'px-3.5 py-2 text-xs'} rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black flex items-center justify-center gap-1.5 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all cursor-pointer active:scale-95 w-full sm:w-auto`}
              >
                <span>Bandcamp</span>
                <ExternalLink className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
