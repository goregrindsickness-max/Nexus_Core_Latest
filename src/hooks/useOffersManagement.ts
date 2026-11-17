import { create } from 'zustand';
import { Offer } from '../types';

interface OffersState {
  offers: Offer[];
  setOffers: (offers: Offer[] | ((prev: Offer[]) => Offer[])) => void;
  blockedPromoters: string[];
  setBlockedPromoters: (promoters: string[] | ((prev: string[]) => string[])) => void;
}

export const useOffersManagement = create<OffersState>((set) => ({
  offers: [],
  setOffers: (offers) => set((state) => ({ offers: typeof offers === 'function' ? offers(state.offers) : offers })),
  blockedPromoters: [],
  setBlockedPromoters: (promoters) => set((state) => ({ blockedPromoters: typeof promoters === 'function' ? promoters(state.blockedPromoters) : promoters })),
}));
