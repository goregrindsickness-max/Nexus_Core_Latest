import React from 'react';

export const formatPostTimestamp = (
  timestampOrPost?: any,
  fallbackCreated?: any
): string => {
  let rawDate: any = null;

  if (timestampOrPost && typeof timestampOrPost === 'object') {
    rawDate = timestampOrPost.created_at ||
      timestampOrPost.timestamp ||
      timestampOrPost.createdAt ||
      timestampOrPost.date ||
      fallbackCreated;
  } else {
    rawDate = timestampOrPost || fallbackCreated;
  }

  // If rawDate is missing or uninformative, check fallback
  if (!rawDate || rawDate === 'Just now' || rawDate === 'Recently') {
    if (fallbackCreated && fallbackCreated !== 'Just now' && fallbackCreated !== 'Recently') {
      rawDate = fallbackCreated;
    }
  }

  if (!rawDate) {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Handle epoch numbers as strings or numbers
  if (typeof rawDate === 'string' && /^\d{10,13}$/.test(rawDate)) {
    rawDate = Number(rawDate);
  }

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) {
    // If it's already a formatted custom string and not generic, preserve it
    if (typeof rawDate === 'string' && rawDate.trim() && rawDate !== 'Just now' && rawDate !== 'Recently') {
      return rawDate;
    }
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) {
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins >= 0 && diffMins < 1) {
      return `Just now • ${timeStr}`;
    } else if (diffMins >= 1 && diffMins < 60) {
      return `${diffMins}m ago • ${timeStr}`;
    }
    return `Today • ${timeStr}`;
  }

  if (isYesterday) {
    return `Yesterday • ${timeStr}`;
  }

  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });

  return `${dateStr} • ${timeStr}`;
};

export const formatTimeAgo = (isoString?: any) => {
  if (!isoString) return 'Just now';
  try {
    let raw = isoString;
    if (typeof raw === 'string' && /^\d{10,13}$/.test(raw)) {
      raw = Number(raw);
    }
    const date = new Date(raw);
    if (isNaN(date.getTime())) return 'Just now';
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Just now';
  }
};

export const isAudioUrl = (url?: string): boolean => {
  if (!url) return false;
  const clean = url.toLowerCase().split('?')[0];
  return clean.endsWith('.mp3') || clean.endsWith('.wav') || clean.endsWith('.ogg') || clean.endsWith('.m4a') || clean.endsWith('.flac') || clean.includes('audio');
};

export const getCollectionsTrackDuration = (trackOrId: any): string => {
  if (!trackOrId) return '3:30';
  if (typeof trackOrId === 'object') {
    if (trackOrId.duration) return String(trackOrId.duration);
    if (trackOrId.trackDuration) return String(trackOrId.trackDuration);
    if (trackOrId.runningTime) return String(trackOrId.runningTime);
    if (trackOrId.id) return getCollectionsTrackDuration(trackOrId.id);
  }
  if (typeof trackOrId === 'string') {
    if (trackOrId.includes(':') && !trackOrId.startsWith('col_') && !trackOrId.startsWith('track_')) {
      return trackOrId;
    }
    const hash = trackOrId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const minutes = 3 + (hash % 4);
    const seconds = ((hash * 7) % 50 + 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  return '3:45';
};

export const enrichTicketData = (gigData: any) => {
  const headliner = (gigData.headliner || gigData.name || 'DETROIT METAL FEST').toUpperCase();
  const venue = gigData.venue || 'The Underground';
  const date = gigData.date || 'TONIGHT';
  const time = gigData.time || 'Doors 8:00 PM';

  // Address lookup based on venue
  let address = '1220 W Sunset Blvd, Los Angeles, CA 90026';
  if (venue.toLowerCase().includes('underground')) {
    address = '1433 N Formosa Ave, West Hollywood, CA 90046';
  } else if (venue.toLowerCase().includes('nexus')) {
    address = '1855 Industrial St, Los Angeles, CA 90021';
  } else if (venue.toLowerCase().includes('warehouse')) {
    address = '2415 E 15th St, Los Angeles, CA 90021';
  } else if (venue.toLowerCase().includes('masonic')) {
    address = '835 S Flower St, Los Angeles, CA 90017';
  } else if (venue.toLowerCase().includes('pit')) {
    address = '601 S Central Ave, Los Angeles, CA 90021';
  } else if (venue.toLowerCase().includes('cathedral')) {
    address = '1200 S Hope St, Los Angeles, CA 90015';
  }

  // Lineup lookup based on headliner
  let lineup = `${headliner}, IMMOLATION, MORTICIAN, SKELETAL REMAINS, AUTOPSY`;
  if (headliner.includes('CRYPTOPSY')) {
    lineup = 'CRYPTOPSY, DYING FETUS, ABORTED, DECREPIT BIRTH, ARCHSPIRE';
  } else if (headliner.includes('MORTICIAN')) {
    lineup = 'MORTICIAN, INCANTATION, SANGUISUGABOGG, PHOBOPHILIC';
  } else if (headliner.includes('DYING FETUS')) {
    lineup = 'DYING FETUS, DEVOURMENT, CORDYCEPS, SANGUISUGABOGG';
  } else if (headliner.includes('DARK FUNERAL')) {
    lineup = 'DARK FUNERAL, BELPHEGOR, INCANTATION, ROTTING CHRIST, GHOST BATH';
  }

  // Flyer images
  let flyer = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80';
  if (headliner.includes('CRYPTOPSY')) {
    flyer = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80';
  } else if (headliner.includes('MORTICIAN')) {
    flyer = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80';
  } else if (headliner.includes('DYING FETUS')) {
    flyer = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80';
  }

  return {
    headliner,
    venue,
    time,
    date,
    venueAddress: address,
    lineup,
    flyer
  };
};

export function compressImageInSocialFeed(base64Str: string, maxWidth = 1920, maxHeight = 1080, quality = 0.92): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width <= 0 || height <= 0) {
        resolve(base64Str);
        return;
      }
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/webp', quality));
        } catch (e) {
          resolve(base64Str);
        }
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

export function getEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const cleanedUrl = url.trim();

  // Spotify
  if (cleanedUrl.includes('spotify.com')) {
    return cleanedUrl.replace(/open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/i, 'open.spotify.com/embed/$1/$2');
  }

  // YouTube (supports watch, shorts, live, youtu.be, embed, mobile)
  const ytMatch = cleanedUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  if (cleanedUrl.includes('youtube.com/embed/') || cleanedUrl.includes('youtube-nocookie.com/embed/')) {
    return cleanedUrl;
  }

  // SoundCloud
  if (cleanedUrl.includes('soundcloud.com')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanedUrl)}&color=%23a855f7&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
  }

  // Bandcamp
  if (cleanedUrl.includes('bandcamp.com')) {
    if (cleanedUrl.includes('EmbeddedPlayer')) {
      return cleanedUrl;
    }
    return null;
  }

  return null;
}

export const extractUUID = (str: string | null | undefined): string | null => {
  if (!str) return null;
  const match = str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return match ? match[0] : null;
};

export const getAvatarForName = (name: string, userProfileName?: string, userProfileAvatar?: string, discoverProfiles: any[] = [], allProfiles: any[] = []) => {
  if (!name) return null;
  
  if (name === userProfileName && userProfileAvatar) {
    return (
      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-900/50">
        <img src={userProfileAvatar} className="w-full h-full object-cover" alt={name} />
      </div>
    );
  }

  const realProfile = allProfiles.find(p => 
    p.full_name?.toLowerCase() === name.toLowerCase() || 
    p.console_handle?.toLowerCase() === name.toLowerCase()
  );

  if (realProfile) {
    const roleStr = realProfile.account_type || 'User';
    let resolvedAvatar = realProfile.avatar_url;
    if (roleStr.toLowerCase().includes('label') && realProfile.label_avatar) resolvedAvatar = realProfile.label_avatar;
    else if (roleStr.toLowerCase().includes('creative') && realProfile.creative_avatar) resolvedAvatar = realProfile.creative_avatar;
    else if (roleStr.toLowerCase().includes('promoter') && realProfile.promoter_logo) resolvedAvatar = realProfile.promoter_logo;

    if (resolvedAvatar) {
      return (
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-900/50">
          <img src={resolvedAvatar} className="w-full h-full object-cover" alt={name} />
        </div>
      );
    }
  }

  const foundProfile = discoverProfiles.find(p => (p?.name || "User").toLowerCase() === name.toLowerCase());
  if (foundProfile && foundProfile.image) {
    return (
      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-900/50">
        <img src={foundProfile.image} className="w-full h-full object-cover" alt={name} />
      </div>
    );
  }

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbacks = [
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=100',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100'
  ];
  const idx = hash % fallbacks.length;
  
  return (
    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-900/50">
      <img src={fallbacks[idx]} className="w-full h-full object-cover" alt={name} />
    </div>
  );
};

export const getWorkspaceBorderColorClass = (key?: string, userProfile?: any) => {
  const currentType = key || userProfile?.account_type || 'fan_only';
  switch (currentType) {
    case 'industry_pro': return 'border-violet-500/30';
    case 'fan':
    case 'fan_only': return 'border-cyan-500/30';
    case 'band': return 'border-emerald-500/30';
    case 'promoter': return 'border-yellow-500/30';
    case 'creative': return 'border-fuchsia-500/30';
    case 'label': return 'border-orange-500/30';
    default: return 'border-cyan-500/30';
  }
};

export const getChatThreadBorderClass = (chat: any) => {
  const role = (chat.role || '').toLowerCase();
  const badge = (chat.roleBadge || '').toLowerCase();
  
  if (role.includes('artist') || role.includes('band') || badge === 'artist') return 'border-emerald-500/30';
  if (role.includes('promoter') || role.includes('venue') || badge === 'promoter') return 'border-yellow-500/30';
  if (role.includes('label') || badge === 'label') return 'border-orange-500/30';
  if (role.includes('creative') || role.includes('crew') || badge === 'crew') return 'border-fuchsia-500/30';
  if (role.includes('pro') || badge === 'pro') return 'border-violet-500/30';
  if (role.includes('fan') || badge === 'fan') return 'border-cyan-500/30';
  return 'border-zinc-800/80';
};

export { playAmbientMetalDrone } from './audioEngine';

export const formatTimeTo12h = (input?: string): string => {
  if (!input) return 'Doors 8:00 PM';
  let str = String(input);
  str = str.replace(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/g, (match, h, m) => {
    let hour = parseInt(h, 10);
    const minute = m;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  });
  str = str.replace(/\b([01][0-9]|2[0-3])([0-5][0-9])\b/g, (match, h, m) => {
    let hour = parseInt(h, 10);
    const minute = m;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  });
  return str;
};

export const hasGigTickets = (gig: any): boolean => {
  if (!gig) return false;
  if (gig.ticketsAvailable === false || gig.ticketStatus === 'unlinked') return false;
  const hasUrl = Boolean(gig.ticketUrl || gig.external_ticket_url || gig.ticket_url || gig.ticket_link);
  const priceStr = String(gig.price || gig.presale_price || gig.day_of_show_price || '').toLowerCase();
  const hasPaidPrice = Boolean(
    priceStr &&
    !priceStr.includes('free') &&
    !priceStr.includes('0.00') &&
    !priceStr.includes('$0') &&
    !priceStr.includes('tba') &&
    !priceStr.includes('crowdsourced')
  );
  return hasUrl || hasPaidPrice || gig.hasTickets === true;
};


