import { useState, useEffect } from 'react';
import { useUserProfileState, UseUserProfileStateProps } from '../../../hooks/useUserProfileState';
import { universalAudioPlayer } from '../../../utils/audioEngine';
import { ROSTER_CATALOGS } from '../../../data/socialFeedMockData';

export interface UseSocialProfileStateParams extends UseUserProfileStateProps {
  quantity?: number;
}

export function useSocialProfileState({
  portalRole,
  userProfile,
  activeBand,
  setUserProfile,
  quantity = 1
}: UseSocialProfileStateParams) {
  // Underlying user profile customization state (pin, handle, genres, avatar, cover, blurb, etc.)
  const profileState = useUserProfileState({
    portalRole,
    userProfile,
    activeBand,
    setUserProfile
  });

  // Collections State
  const [myCollections, setMyCollections] = useState<{ id: string; type: 'merch' | 'ticket' | 'music'; data: any; quantity: number; date: Date }[]>(() => {
    try {
      const stored = localStorage.getItem('nexus_my_collections_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            ...item,
            date: new Date(item.date)
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to load collections from localStorage", e);
    }
    return [
      {
        id: 'col_m1',
        type: 'music',
        data: {
          title: 'Reign Supreme',
          band: 'DYING FETUS',
          thumbnail: 'https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=400&q=80'
        },
        quantity: 1,
        date: new Date()
      },
      {
        id: 'col_t1',
        type: 'ticket',
        data: {
          headliner: 'DYING FETUS',
          venue: 'The Underground',
          time: 'Doors 8:00 PM',
          ticketType: 'VIP Ultimate Fan Bundle',
          lineup: 'DYING FETUS, IMMOLATION, MORTICIAN, SKELETAL REMAINS',
          venueAddress: '1433 N Formosa Ave, West Hollywood, CA 90046',
          flyer: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
          attendees: [
            { name: 'John Gallagher', tier: 'vip_merch', size: 'L' },
            { name: 'Sean Beasley', tier: 'vip_merch', size: 'XL' }
          ]
        },
        quantity: 2,
        date: new Date()
      },
      {
        id: 'col_m2',
        type: 'merch',
        data: {
          title: 'Destroy the Opposition Heavyweight Hoodie',
          seller: 'Dying Fetus Official Shop',
          source: 'Official Shop',
          price: 65.00,
          size: 'XL',
          image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
          purchasedFrom: 'In-App Band Shop',
          orderNumber: 'ORD-882910'
        },
        quantity: 1,
        date: new Date()
      },
      {
        id: 'col_m3',
        type: 'merch',
        data: {
          title: 'Pierced From Within Vintage Tour Shirt',
          seller: '@DeathMetalCollector',
          source: 'User Closet',
          price: 45.00,
          size: 'L',
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
          purchasedFrom: "User's For Sale Closet",
          orderNumber: 'CLOSET-44910'
        },
        quantity: 1,
        date: new Date()
      }
    ];
  });

  const [collectionTab, setCollectionTab] = useState<'tickets' | 'music' | 'merch' | 'for_sale'>('tickets');
  const [viewingReceipt, setViewingReceipt] = useState<{ type: 'merch' | 'ticket' | 'music', data: any, id: string, quantity: number, date: Date } | null>(null);

  // Ticket Upgrades, Personalization and Transfer States
  const [selectedTicketTier, setSelectedTicketTier] = useState<'ga' | 'vip' | 'vip_merch'>('ga');
  const [attendeeDetails, setAttendeeDetails] = useState<{ name: string; size: string }[]>([{ name: '', size: 'M' }]);
  const [transferMode, setTransferMode] = useState<'none' | 'select' | 'transfer' | 'resell'>('none');
  const [transferRecipient, setTransferRecipient] = useState<string>('');
  const [transferMessage, setTransferMessage] = useState<string>('');
  const [resellPrice, setResellPrice] = useState<string>('');
  const [resellPaymentInfo, setResellPaymentInfo] = useState<string>('');
  const [resellMethod, setResellMethod] = useState<'marketplace' | 'private'>('marketplace');
  const [transferringAttendeeIndex, setTransferringAttendeeIndex] = useState<number>(0);
  const [simulatedResaleBalance, setSimulatedResaleBalance] = useState<number>(0);

  useEffect(() => {
    setAttendeeDetails(prev => {
      const updated = [...prev];
      if (updated.length < quantity) {
        for (let i = updated.length; i < quantity; i++) {
          updated.push({ name: '', size: 'M' });
        }
      } else if (updated.length > quantity) {
        return updated.slice(0, quantity);
      }
      return updated;
    });
  }, [quantity]);

  // Collections Premium Music Player States
  const [collPlayerActiveId, setCollPlayerActiveId] = useState<string | null>('col_m1');
  const [collPlayerActiveTrackId, setCollPlayerActiveTrackId] = useState<string | null>('col_m1_t1');
  const [collPlayerIsPlaying, setCollPlayerIsPlaying] = useState<boolean>(false);
  const [collPlayerProgress, setCollPlayerProgress] = useState<number>(18);
  const [collPlayerVolume, setCollPlayerVolume] = useState<number>(0.75);
  const [collPlayerRatings, setCollPlayerRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (collPlayerIsPlaying) {
      const activeItem = myCollections.find(c => c.id === collPlayerActiveId);
      universalAudioPlayer.play(
        {
          id: collPlayerActiveTrackId || 'coll_track',
          title: activeItem?.data?.title || 'Collection Master',
          artist: activeItem?.data?.band || 'Nexus Metal',
          album: activeItem?.data?.title,
          duration: '3:45'
        },
        {
          onProgress: (pct) => setCollPlayerProgress(pct),
          onEnded: () => {
            setCollPlayerIsPlaying(false);
            setCollPlayerProgress(0);
          },
          onStateChange: (isPlaying) => setCollPlayerIsPlaying(isPlaying)
        }
      );
    } else {
      if (!profileIsPlaying) {
        universalAudioPlayer.pause();
      }
    }
  }, [collPlayerIsPlaying, collPlayerActiveId, collPlayerActiveTrackId]);

  useEffect(() => {
    universalAudioPlayer.setVolume(collPlayerVolume);
  }, [collPlayerVolume]);

  // Profile Playback States
  const [profileActivePlaybackTrackId, setProfileActivePlaybackTrackId] = useState<string | null>(null);
  const [profileIsPlaying, setProfileIsPlaying] = useState<boolean>(false);
  const [profilePlaybackProgress, setProfilePlaybackProgress] = useState<number>(0);
  const [profileAudioVolume, setProfileAudioVolume] = useState<number>(0.75);
  const [rotationIsPlaying, setRotationIsPlaying] = useState<string | null>(null);

  useEffect(() => {
    if (profileIsPlaying && profileActivePlaybackTrackId) {
      // Find matching track in ROSTER_CATALOGS
      let matchedTrack: any = null;
      let matchedBand = userProfile?.band_name || userProfile?.name || userProfile?.handle || 'Artist';
      let matchedAlbum = 'Official Catalog';
      let matchedCover = userProfile?.avatar || undefined;

      for (const [bandName, catalog] of Object.entries(ROSTER_CATALOGS || {})) {
        const found = (catalog as any).tracks?.find((t: any) => t.id === profileActivePlaybackTrackId);
        if (found) {
          matchedTrack = found;
          matchedBand = bandName;
          matchedAlbum = (catalog as any).albumName || matchedAlbum;
          matchedCover = (catalog as any).coverUrl || matchedCover;
          break;
        }
      }

      universalAudioPlayer.play(
        {
          id: profileActivePlaybackTrackId,
          title: matchedTrack?.title || 'Catalog Master',
          artist: matchedBand,
          album: matchedAlbum,
          coverUrl: matchedCover,
          audioUrl: matchedTrack?.audioUrl || matchedTrack?.url,
          duration: matchedTrack?.duration || '3:30'
        },
        {
          onProgress: (pct) => setProfilePlaybackProgress(pct),
          onEnded: () => {
            setProfileIsPlaying(false);
            setProfilePlaybackProgress(0);
          },
          onStateChange: (isPlaying) => setProfileIsPlaying(isPlaying)
        }
      );
    } else if (!profileIsPlaying && !collPlayerIsPlaying) {
      universalAudioPlayer.pause();
    }
  }, [profileIsPlaying, profileActivePlaybackTrackId, userProfile]);

  useEffect(() => {
    universalAudioPlayer.setVolume(profileAudioVolume);
  }, [profileAudioVolume]);

  return {
    ...profileState,

    // Collections
    myCollections,
    setMyCollections,
    collectionTab,
    setCollectionTab,
    viewingReceipt,
    setViewingReceipt,

    // Ticket upgrades & transfer
    selectedTicketTier,
    setSelectedTicketTier,
    attendeeDetails,
    setAttendeeDetails,
    transferMode,
    setTransferMode,
    transferRecipient,
    setTransferRecipient,
    transferMessage,
    setTransferMessage,
    resellPrice,
    setResellPrice,
    resellPaymentInfo,
    setResellPaymentInfo,
    resellMethod,
    setResellMethod,
    transferringAttendeeIndex,
    setTransferringAttendeeIndex,
    simulatedResaleBalance,
    setSimulatedResaleBalance,

    // Collections player
    collPlayerActiveId,
    setCollPlayerActiveId,
    collPlayerActiveTrackId,
    setCollPlayerActiveTrackId,
    collPlayerIsPlaying,
    setCollPlayerIsPlaying,
    collPlayerProgress,
    setCollPlayerProgress,
    collPlayerVolume,
    setCollPlayerVolume,
    collPlayerRatings,
    setCollPlayerRatings,

    // Profile playback
    profileActivePlaybackTrackId,
    setProfileActivePlaybackTrackId,
    profileIsPlaying,
    setProfileIsPlaying,
    profilePlaybackProgress,
    setProfilePlaybackProgress,
    profileAudioVolume,
    setProfileAudioVolume,
    rotationIsPlaying,
    setRotationIsPlaying
  };
}

