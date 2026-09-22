import React, { useState, useEffect, useRef } from 'react';
import { Disc, ExternalLink, Music2, Loader2 } from 'lucide-react';
import { requestPauseSceneRadio } from '../utils/mediaPlaybackCoordinator';
import { resolveBandcampMetadata, formatBandcampEmbedDarkUrl, openBandcampLink, extractSlugMetadata, BandcampResolvedData } from '../../../utils/socialFeedUtils';
import { getSupabase } from '../../../supabase';

interface BandcampEmbedCardProps {
  post?: any;
  embedUrl?: string | null;
  title?: string;
  artist?: string;
  pageUrl?: string;
  itemType?: 'track' | 'album' | 'unknown';
  compact?: boolean;
  artworkUrl?: string | null;
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
  artist: directArtist,
  pageUrl: directPageUrl,
  itemType: directItemType,
  compact = false,
  artworkUrl: directArtworkUrl
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

  // If rawEmbedUrl is a regular Bandcamp link without EmbeddedPlayer, resolve it asynchronously
  useEffect(() => {
    if (!rawEmbedUrl || typeof rawEmbedUrl !== 'string') return;
    if (rawEmbedUrl.includes('EmbeddedPlayer')) return;

    let isMounted = true;
    setIsResolving(true);

    resolveBandcampMetadata(rawEmbedUrl)
      .then((res) => {
        if (isMounted) {
          if (res && res.success && res.embedUrl) {
            setAsyncResolved(res);

            // Asynchronously backfill Supabase if post was missing pre-resolved embedUrl
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
  }, [rawEmbedUrl, post?.id]);

  const activeEmbedUrl = asyncResolved?.embedUrl || directEmbedUrl || bData.embedUrl || bData.embed_url || (rawEmbedUrl && rawEmbedUrl.includes('EmbeddedPlayer') ? rawEmbedUrl : null);
  
  const slugMeta = rawEmbedUrl && !rawEmbedUrl.includes('EmbeddedPlayer') ? extractSlugMetadata(rawEmbedUrl) : { artist: '', title: '', itemType: 'track' as const };

  const trackTitle = directTitle || asyncResolved?.title || bData.title || (post as any)?.songData?.title || (post as any)?.title || slugMeta.title || 'Bandcamp Release';
  const artistName = directArtist || asyncResolved?.artist || bData.artist || (post as any)?.songData?.band || (post as any)?.authorName || (post as any)?.author?.name || slugMeta.artist || '';
  const pageLink = directPageUrl || asyncResolved?.pageUrl || bData.pageUrl || bData.page_url || post?.mediaUrl || (post as any)?.media_url || (rawEmbedUrl && !rawEmbedUrl.includes('EmbeddedPlayer') ? rawEmbedUrl : null);
  const itemType = directItemType || asyncResolved?.itemType || bData.itemType || bData.item_type || slugMeta.itemType || (rawEmbedUrl?.includes('album=') ? 'album' : 'track');
  const artworkUrl = directArtworkUrl || asyncResolved?.artwork || (asyncResolved as any)?.artworkUrl || bData.artwork || bData.artworkUrl || bData.artwork_url || bData.imageUrl || bData.image_url || post?.imageUrl || post?.image_url || post?.image || null;

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

  const iframeHeight = compact ? '120px' : (itemType === 'album' ? '180px' : '120px');

  return (
    <div 
      className="my-3 rounded-2xl overflow-hidden border border-cyan-500/40 hover:border-cyan-400/60 bg-black shadow-[0_4px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(6,182,212,0.12)] group/bandcamp transition-all duration-300"
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
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-black via-zinc-950 to-[#02181f] border-b border-cyan-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.25)] overflow-hidden">
            {artworkUrl && !headerImgError ? (
              <img 
                src={artworkUrl} 
                alt={trackTitle} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={() => setHeaderImgError(true)}
              />
            ) : (
              <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '5s' }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                BANDCAMP
              </span>
            </div>
            {trackTitle && (
              <AutoScrollText 
                title={`${trackTitle}${artistName ? ` by ${artistName}` : ''}`}
                className="text-[11px] font-semibold text-zinc-100 leading-tight mt-0.5"
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
            onClick={() => openBandcampLink(pageLink)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 text-[9px] font-mono font-bold uppercase tracking-wider transition-all shrink-0 ml-2 shadow-[0_0_10px_rgba(6,182,212,0.15)] cursor-pointer"
          >
            <span>BUY / SUPPORT</span>
            <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
          </button>
        )}
      </div>

      {/* Embed Player Iframe Container with Side-by-Side Album Art / Dedicated Release Preview Fallback */}
      <div className="relative w-full bg-black min-h-[120px]">
        {resolvedIframeSrc && resolvedIframeSrc.includes('EmbeddedPlayer') ? (
          <div className="flex flex-col sm:flex-row items-stretch bg-black border-t border-cyan-500/30">
            {/* Album Art / Vinyl Thumbnail on Left (Fills full height of container) */}
            <div className="w-full sm:w-auto sm:aspect-square h-32 sm:h-auto bg-zinc-950 flex items-center justify-center shrink-0 border-b sm:border-b-0 sm:border-r border-cyan-500/30 relative overflow-hidden group/art">
              <div className="absolute inset-0 opacity-25 filter blur-sm">
                {artworkUrl && !artImgError ? (
                  <img 
                    src={artworkUrl} 
                    alt={trackTitle} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={() => setArtImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-950 to-zinc-900" />
                )}
              </div>
              <div className="relative h-full aspect-square overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.4)] border-x border-cyan-400/50 sm:border-x-0 bg-black flex items-center justify-center">
                {artworkUrl && !artImgError ? (
                  <img 
                    src={artworkUrl} 
                    alt={trackTitle} 
                    className="w-full h-full object-cover group-hover/art:scale-105 transition-transform duration-300" 
                    referrerPolicy="no-referrer"
                    onError={() => setArtImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#02181f] via-zinc-900 to-black flex flex-col items-center justify-center p-2 text-center">
                    <Disc className="w-8 h-8 text-cyan-400 animate-spin mb-1" style={{ animationDuration: '6s' }} />
                    <span className="text-[9px] font-mono font-bold text-cyan-300 truncate w-full">{artistName || 'BANDCAMP'}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 bg-black relative">
              <iframe
                src={resolvedIframeSrc}
                title={trackTitle || "Bandcamp Player"}
                style={{ border: 0, width: '100%', height: iframeHeight }}
                seamless
                loading="eager"
                referrerPolicy="no-referrer"
                allow="autoplay; encrypted-media; fullscreen; clipboard-write; picture-in-picture"
                className="w-full relative z-10 block bg-black"
              />
            </div>
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
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-gradient-to-r from-cyan-950/30 via-black to-zinc-950 border-t border-cyan-500/30 hover:border-cyan-400/80 transition-all cursor-pointer group/fallback"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)] overflow-hidden group-hover/fallback:scale-105 transition-transform">
                {artworkUrl && !fallbackImgError ? (
                  <img 
                    src={artworkUrl} 
                    alt={trackTitle} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={() => setFallbackImgError(true)}
                  />
                ) : (
                  <Music2 className="w-6 h-6 text-cyan-400 animate-pulse" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    BANDCAMP RELEASE PREVIEW
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {trackTitle}
                </div>
                <div className="text-[10px] text-cyan-300/80 mt-0.5 truncate">
                  {artistName || 'Bandcamp Artist'}
                </div>
                <span className="text-[9px] font-mono text-cyan-400/60 mt-1 block truncate">
                  {pageLink || rawEmbedUrl || 'bandcamp.com'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openBandcampLink(pageLink || rawEmbedUrl);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-black flex items-center justify-center gap-1.5 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all cursor-pointer active:scale-95 w-full sm:w-auto"
            >
              <span>Listen on Bandcamp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
