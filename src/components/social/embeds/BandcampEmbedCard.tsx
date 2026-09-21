import React, { useState, useEffect, useRef } from 'react';
import { Disc, ExternalLink, Music2, Loader2 } from 'lucide-react';
import { requestPauseSceneRadio } from '../utils/mediaPlaybackCoordinator';
import { resolveBandcampMetadata, formatBandcampEmbedDarkUrl, BandcampResolvedData } from '../../../utils/socialFeedUtils';

interface BandcampEmbedCardProps {
  post?: any;
  embedUrl?: string | null;
  title?: string;
  artist?: string;
  pageUrl?: string;
  itemType?: 'track' | 'album' | 'unknown';
  compact?: boolean;
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
  compact = false
}) => {
  const bData = post?.bandcampData || {};
  const rawEmbedUrl = directEmbedUrl || bData.embedUrl || post?.bandcampUrl || (post?.mediaUrl && post.mediaUrl.includes('bandcamp.com') ? post.mediaUrl : null) || (post?.image_url && post.image_url.includes('bandcamp.com') ? post.image_url : null);
  const [asyncResolved, setAsyncResolved] = useState<BandcampResolvedData | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);

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
  }, [rawEmbedUrl]);

  const activeEmbedUrl = asyncResolved?.embedUrl || directEmbedUrl || bData.embedUrl || (rawEmbedUrl && rawEmbedUrl.includes('EmbeddedPlayer') ? rawEmbedUrl : null);
  const trackTitle = directTitle || asyncResolved?.title || bData.title || post?.songData?.title || 'Bandcamp Stream';
  const artistName = directArtist || asyncResolved?.artist || bData.artist || post?.songData?.band || post?.authorName || '';
  const pageLink = directPageUrl || asyncResolved?.pageUrl || bData.pageUrl || post?.mediaUrl || (rawEmbedUrl && !rawEmbedUrl.includes('EmbeddedPlayer') ? rawEmbedUrl : null);
  const itemType = directItemType || asyncResolved?.itemType || bData.itemType || (rawEmbedUrl?.includes('album=') ? 'album' : 'track');

  // Format the iframe embed src URL with pitch black background and cyan highlights
  let resolvedIframeSrc: string | null = null;
  if (activeEmbedUrl) {
    resolvedIframeSrc = formatBandcampEmbedDarkUrl(activeEmbedUrl);
  } else if (rawEmbedUrl) {
    if (rawEmbedUrl.includes('EmbeddedPlayer')) {
      resolvedIframeSrc = formatBandcampEmbedDarkUrl(rawEmbedUrl);
    } else {
      // Check if trackId or albumId is available
      const trackMatch = rawEmbedUrl.match(/track=(\d+)/i) || bData.trackId;
      const albumMatch = rawEmbedUrl.match(/album=(\d+)/i) || bData.albumId;
      if (trackMatch) {
        const tId = typeof trackMatch === 'string' ? trackMatch : trackMatch[1];
        resolvedIframeSrc = `https://bandcamp.com/EmbeddedPlayer/track=${tId}/size=large/bgcol=000000/linkcol=06b6d4/tracklist=false/artwork=small/transparent=true/`;
      } else if (albumMatch) {
        const aId = typeof albumMatch === 'string' ? albumMatch : albumMatch[1];
        resolvedIframeSrc = `https://bandcamp.com/EmbeddedPlayer/album=${aId}/size=large/bgcol=000000/linkcol=06b6d4/tracklist=false/artwork=small/transparent=true/`;
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
          <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
            <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '5s' }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                BANDCAMP
              </span>
            </div>
            {trackTitle && trackTitle !== 'Bandcamp Stream' && (
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
          <a
            href={pageLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 text-[9px] font-mono font-bold uppercase tracking-wider transition-all shrink-0 ml-2 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          >
            <span>BUY / SUPPORT</span>
            <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
          </a>
        )}
      </div>

      {/* Embed Player Iframe Container */}
      <div className="relative w-full bg-black min-h-[120px]">
        {resolvedIframeSrc && resolvedIframeSrc.includes('EmbeddedPlayer') ? (
          <iframe
            src={resolvedIframeSrc}
            title={trackTitle || "Bandcamp Player"}
            style={{ border: 0, width: '100%', height: iframeHeight }}
            seamless
            loading="lazy"
            allow="autoplay"
            className="w-full relative z-10 block bg-black"
          />
        ) : isResolving ? (
          <div className="p-6 flex flex-col items-center justify-center gap-2 bg-black text-center border-t border-cyan-950/60">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="font-bold uppercase tracking-wider">RESOLVING BANDCAMP PLAYER...</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Connecting to audio stream and embed data</p>
          </div>
        ) : (
          <div className="p-4 flex items-center justify-between gap-3 bg-black border-t border-cyan-950/60">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <Music2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <AutoScrollText title={trackTitle} className="text-xs font-bold text-white">
                  {trackTitle}
                </AutoScrollText>
                <AutoScrollText title={artistName || 'Bandcamp Audio'} className="text-[10px] text-cyan-300/80 mt-0.5">
                  {artistName || 'Bandcamp Audio'}
                </AutoScrollText>
                <span className="text-[9px] font-mono text-cyan-400/70">bandcamp.com</span>
              </div>
            </div>

            {pageLink && (
              <a
                href={pageLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-black flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
              >
                <span>Play on Bandcamp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
