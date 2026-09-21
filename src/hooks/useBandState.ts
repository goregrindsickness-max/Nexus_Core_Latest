import { create } from 'zustand';
import { Band, BandJoinRequest } from '../types';
import { verifyAndResyncBandLogo } from '../supabase';

interface BandState {
  bands: any[];
  setBands: (bands: any[] | ((prev: any[]) => any[])) => void;
  activeBandId: string;
  setActiveBandId: (id: string) => void;
  currentLoadedBandId: string;
  setCurrentLoadedBandId: (id: string) => void;
  editingBand: Band | null;
  setEditingBand: (band: Band | null) => void;
  deletingBandId: string | null;
  setDeletingBandId: (id: string | null) => void;
  bandLineup: { id: string; name: string; role: string; inviteStatus?: 'accepted' | 'pending' | 'none'; clearanceLevel?: number }[];
  setBandLineup: (lineup: any[] | ((prev: any[]) => any[])) => void;
  crewMembers: { id: string; name: string; role: string; contact?: string }[];
  setCrewMembers: (crew: any[] | ((prev: any[]) => any[])) => void;
  bandLogoUrl: string;
  setBandLogoUrl: (url: string) => void;
  bandCoverUrl: string;
  setBandCoverUrl: (url: string) => void;
  selectedMicroGenres: string[];
  setSelectedMicroGenres: (genres: string[]) => void;
  bandJoinRequests: BandJoinRequest[];
  setBandJoinRequests: (requests: BandJoinRequest[] | ((prev: BandJoinRequest[]) => BandJoinRequest[])) => void;
}

const getInitialJoinRequests = () => {
  try {
    const saved = localStorage.getItem('nexus_core_band_join_requests_v1');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return [];
};

export const useBandState = create<BandState>((set) => ({
  bands: [],
  setBands: (bands) => set((state) => ({ bands: typeof bands === 'function' ? bands(state.bands) : bands })),
  activeBandId: '',
  setActiveBandId: (id) => set({ activeBandId: id }),
  currentLoadedBandId: '',
  setCurrentLoadedBandId: (id) => set({ currentLoadedBandId: id }),
  editingBand: null,
  setEditingBand: (band) => set({ editingBand: band }),
  deletingBandId: null,
  setDeletingBandId: (id) => set({ deletingBandId: id }),
  bandLineup: [],
  setBandLineup: (lineup) => set((state) => ({ bandLineup: typeof lineup === 'function' ? lineup(state.bandLineup) : lineup })),
  crewMembers: [],
  setCrewMembers: (crew) => set((state) => ({ crewMembers: typeof crew === 'function' ? crew(state.crewMembers) : crew })),
  bandLogoUrl: '',
  setBandLogoUrl: (url) => {
    set({ bandLogoUrl: url });
    try {
      if (url) {
        verifyAndResyncBandLogo(url);
      }
    } catch (_) {}
  },
  bandCoverUrl: '',
  setBandCoverUrl: (url) => set({ bandCoverUrl: url }),
  selectedMicroGenres: [],
  setSelectedMicroGenres: (genres) => set({ selectedMicroGenres: genres }),
  bandJoinRequests: getInitialJoinRequests(),
  setBandJoinRequests: (requests) => set((state) => {
    const newVal = typeof requests === 'function' ? requests(state.bandJoinRequests) : requests;
    localStorage.setItem('nexus_core_band_join_requests_v1', JSON.stringify(newVal));
    return { bandJoinRequests: newVal };
  }),
}));
