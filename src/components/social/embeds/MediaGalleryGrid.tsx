import React from 'react';
import { Maximize2, MapPin, Ticket, Calendar } from 'lucide-react';

interface MediaGalleryGridProps {
  images?: string[];
  imageUrl?: string;
  onOpenLightbox: (images: string[], index: number) => void;
  tag?: string;
  location?: string;
  ticketData?: any;
  eventData?: any;
  onOpenTicketModal?: (ticketData: any) => void;
  onSelectTicketShow?: (dateObj: any) => void;
}

export const MediaGalleryGrid: React.FC<MediaGalleryGridProps> = ({
  images,
  imageUrl,
  onOpenLightbox,
  tag,
  location,
  ticketData,
  eventData,
  onOpenTicketModal,
  onSelectTicketShow,
}) => {
  const isTourFlyer = Boolean(
    (ticketData && (ticketData.ticketUrl || (ticketData.date && ticketData.date !== 'Upcoming Tour Date'))) ||
    (eventData && (eventData.category?.toLowerCase().includes('tour') || eventData.title?.toLowerCase().includes('tour'))) ||
    tag === 'TOUR DATES' ||
    tag === 'TOUR ANNOUNCEMENT'
  );

  const hasValidTickets = Boolean(
    ticketData &&
    (ticketData.ticketUrl || ticketData.external_ticket_url || (ticketData.date && ticketData.date !== 'Upcoming Tour Date' && ticketData.venue))
  );

  const renderSingleImage = (src: string) => (
    <div 
      className="-mx-4 sm:-mx-5 my-2.5 relative group overflow-hidden border-y border-zinc-800/80 bg-zinc-950 max-h-[520px] min-h-[220px] sm:min-h-[280px] flex items-center justify-center cursor-pointer shadow-2xl transition-all"
      onClick={() => onOpenLightbox([src], 0)}
    >
      {/* Ambient Blurred Backdrop for vertical posters */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${src})` }}
      />

      {/* Main Image */}
      <img 
        src={src} 
        alt="Post media" 
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800';
        }}
        className="w-full max-h-[520px] object-contain relative z-10 group-hover:scale-[1.01] transition-transform duration-500" 
      />

      {/* Top Subtle Vignette Gradient & Badge */}
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-20 pointer-events-none flex items-start justify-between p-3">
        <div className="pointer-events-auto">
          {isTourFlyer && (
            <div className="bg-purple-950/90 backdrop-blur-md border border-purple-500/60 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[10px] font-mono text-purple-200 shadow-lg">
              <Calendar className="w-3 h-3 text-purple-400" />
              <span className="font-black uppercase tracking-wider">Tour Flyer</span>
            </div>
          )}
        </div>

        {/* Zoom Hint Button */}
        <div className="bg-black/75 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-mono pointer-events-auto ml-auto">
          <Maximize2 className="w-3 h-3 text-rose-400" />
          <span className="hidden sm:inline">Inspect</span>
        </div>
      </div>

      {/* Bottom Subtle Vignette Gradient & Integrated Metadata Overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-20 pt-8 pb-3 px-3 sm:px-4 flex items-end justify-between gap-3 pointer-events-none">
        <div className="min-w-0 pointer-events-auto">
          {location ? (
            <div className="inline-flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-zinc-700/70 px-2.5 py-1 rounded-lg shadow-md max-w-full truncate">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-zinc-200 uppercase tracking-wider truncate">
                {location}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest hidden sm:inline-block">
              Edge-to-Edge Showcase
            </span>
          )}
        </div>

        {/* Optional Integrated 1-Tap Ticket / RSVP CTA (only when valid ticket links or explicit dates exist) */}
        {hasValidTickets && ticketData && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenTicketModal) {
                onOpenTicketModal(ticketData);
              } else if (onSelectTicketShow) {
                onSelectTicketShow({
                  date: ticketData.date,
                  venue: ticketData.venue,
                  city: location || 'Local Venue',
                  ticketStatus: 'available',
                });
              }
            }}
            className="pointer-events-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer"
          >
            <Ticket className="w-3 h-3" />
            <span>Tickets</span>
          </button>
        )}
      </div>
    </div>
  );

  if (images && images.length > 0) {
    if (images.length === 1) {
      return renderSingleImage(images[0]);
    }

    if (images.length === 2) {
      return (
        <div className="-mx-4 sm:-mx-5 my-2.5 relative border-y border-zinc-800/80 bg-black">
          <div className="grid grid-cols-2 gap-[2px] bg-zinc-900 aspect-[3/2] cursor-pointer">
            {images.map((img, i) => (
              <div key={`mg-2-${i}-${img.slice(0, 15)}`} className="relative h-full group overflow-hidden bg-black" onClick={() => onOpenLightbox(images, i)}>
                <img 
                  src={img} 
                  alt={`Media ${i}`} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300 border border-white/10">
                  #{i + 1}
                </div>
              </div>
            ))}
          </div>

          {location && (
            <div className="absolute bottom-2 left-3 z-20 pointer-events-none">
              <div className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md border border-zinc-700/70 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-200">
                <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="-mx-4 sm:-mx-5 my-2.5 relative border-y border-zinc-800/80 bg-black">
          <div className="grid grid-cols-2 gap-[2px] bg-zinc-900 aspect-square cursor-pointer">
            <div className="relative h-full group overflow-hidden bg-black" onClick={() => onOpenLightbox(images, 0)}>
              <img 
                src={images[0]} 
                alt="Media 0" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300 border border-white/10">
                #1
              </div>
            </div>
            <div className="grid grid-rows-2 gap-[2px] h-full bg-zinc-900">
              {images.slice(1, 3).map((img, i) => (
                <div key={`mg-3-${i + 1}-${img.slice(0, 15)}`} className="relative h-full group overflow-hidden bg-black" onClick={() => onOpenLightbox(images, i + 1)}>
                  <img 
                    src={img} 
                    alt={`Media ${i + 1}`} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300 border border-white/10">
                    #{i + 2}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {location && (
            <div className="absolute bottom-2 left-3 z-20 pointer-events-none">
              <div className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md border border-zinc-700/70 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-200">
                <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="-mx-4 sm:-mx-5 my-2.5 relative border-y border-zinc-800/80 bg-black">
        <div className="grid grid-cols-2 grid-rows-2 gap-[2px] bg-zinc-900 aspect-square cursor-pointer">
          {images.slice(0, 4).map((img, i) => (
            <div key={`mg-4-${i}-${img.slice(0, 15)}`} className="relative h-full group overflow-hidden bg-black" onClick={() => onOpenLightbox(images, i)}>
              <img 
                src={img} 
                alt={`Media ${i}`} 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300 border border-white/10">
                #{i + 1}
              </div>
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center hover:bg-black/65 transition-colors">
                  <span className="text-white font-mono font-black text-2xl">+{images.length - 4}</span>
                  <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest mt-0.5 font-bold">More Shots</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {location && (
          <div className="absolute bottom-2 left-3 z-20 pointer-events-none">
            <div className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md border border-zinc-700/70 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-200">
              <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (imageUrl) {
    return renderSingleImage(imageUrl);
  }

  return null;
};

