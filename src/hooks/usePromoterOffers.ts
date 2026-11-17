import { useEffect } from 'react';
import { Offer, Show } from '../types';
import { useOffersManagement } from './useOffersManagement';
import { offersStore } from '../utils/indexedDB';

interface UsePromoterOffersOptions {
  isHydrated: boolean;
  bands: any[];
  activeBandId: string;
  setShows: React.Dispatch<React.SetStateAction<Show[]>>;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
}

export function usePromoterOffers({
  isHydrated,
  bands,
  activeBandId,
  setShows,
  triggerNotification,
  addLog
}: UsePromoterOffersOptions) {
  const { offers, setOffers, blockedPromoters, setBlockedPromoters } = useOffersManagement();

  // Save offers to offline store when offers or isHydrated change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      offersStore.setItem('nexus_master_offers', JSON.stringify(offers)).catch(e => console.warn(e));
      localStorage.setItem('nexus_core_offers_offline', JSON.stringify(offers));
    } catch (e) {
      console.error('Failed to save offers:', e);
    }
  }, [offers, isHydrated]);

  // Seed default offers on mount if empty
  useEffect(() => {
    if (offers.length === 0) {
      const activeBand = bands.find(b => b.id === activeBandId) || bands[0] || null;
      const seedOffers: Offer[] = [
        {
          id: 'offer-seed-1',
          promoter_id: 'promoter-live-nation',
          promoter_name: 'Live Nation Austin',
          promoter_email: 'austin-booking@livenation.com',
          promoter_phone: '+1 (512) 555-0112',
          band_id: activeBandId || '',
          band_name: activeBand ? activeBand?.name : 'Sanguisugabogg',
          venue_name: "Emo's Austin",
          city: 'Austin',
          state_province: 'TX',
          country: 'USA',
          date: '2026-07-12',
          guarantee_amount: 1500,
          status: 'pending',
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          notes: 'Direct support slot. Soundcheck allocated: 30 minutes. Merch split 80/20 in band favor.',
          last_action_by: 'promoter'
        },
        {
          id: 'offer-seed-2',
          promoter_id: 'promoter-spune',
          promoter_name: 'Spune Productions',
          promoter_email: 'booking@spune.com',
          promoter_phone: '+1 (214) 555-0144',
          band_id: activeBandId || '',
          band_name: activeBand ? activeBand?.name : 'Sanguisugabogg',
          venue_name: 'Tulips FTW',
          city: 'Fort Worth',
          state_province: 'TX',
          country: 'USA',
          date: '2026-07-20',
          guarantee_amount: 1800,
          status: 'renegotiating',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          notes: 'Full headline slot. Catering: $25 buyout per crew member. Hotel accommodations included.',
          renegotiation_notes: 'Could we raise starting guarantee to $2,000 flat to offset transportation?',
          last_action_by: 'band'
        }
      ];
      setOffers(seedOffers);
    }
  }, [bands, activeBandId, offers.length, setOffers]);

  // Sync blocked promoters persistence
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('nexus_core_blocked_promoters', JSON.stringify(blockedPromoters));
  }, [blockedPromoters, isHydrated]);

  const handleCreateOffer = (newOffer: Offer) => {
    if (blockedPromoters.includes(newOffer.promoter_id)) {
      newOffer.status = 'declined';
      newOffer.notes = 'AUTOMATICALLY DECLINED: The target roster has blocked future offers from your account.';
    }
    setOffers(prev => [newOffer, ...prev]);
    triggerNotification(`Formal Booking Offer for ${newOffer.band_name} registered!`);
    addLog(`Promoter offered $${newOffer.guarantee_amount} to ${newOffer.band_name} at ${newOffer.venue_name}.`);
  };

  const handleUpdateOffer = (updatedOffer: Offer) => {
    setOffers(prev => prev.map(o => o.id === updatedOffer.id ? updatedOffer : o));
    if (updatedOffer.status === 'accepted') {
      const newShow: Show = {
        id: `show-offer-${updatedOffer.id}`,
        created_at: new Date().toISOString(),
        name: updatedOffer.venue_name,
        date: updatedOffer.date,
        status: 'Active',
        guarantee_amount: updatedOffer.guarantee_amount,
        revenue: updatedOffer.guarantee_amount,
        show_type: updatedOffer.show_type === 'festival' ? 'festival' : 'headliner',
        band_id: updatedOffer.band_id,
        city: updatedOffer.city,
        state_province: updatedOffer.state_province,
        country: updatedOffer.country,
        promoter_contact: `${updatedOffer.promoter_name} (${updatedOffer.promoter_email})`,
        additional_notes: updatedOffer.notes || '',
        event_scope: 'single',
        load_in_time: updatedOffer.load_in_time || '16:00',
        doors_time: updatedOffer.doors_time || '19:00',
        set_time: updatedOffer.set_time || '21:00',
        curfew_time: updatedOffer.curfew_time || '23:30',
        venue_address: updatedOffer.venue_address || '',
        expected_attendance: updatedOffer.expected_attendance || '300-700',
        age_restriction: updatedOffer.age_restriction || 'all'
      };

      setShows(sPrev => {
        if ((sPrev || []).some(s => s.id === newShow.id)) {
          return sPrev.map(s => s.id === newShow.id ? {
            ...s,
            load_in_time: updatedOffer.load_in_time || s.load_in_time,
            doors_time: updatedOffer.doors_time || s.doors_time,
            set_time: updatedOffer.set_time || s.set_time,
            curfew_time: updatedOffer.curfew_time || s.curfew_time,
            venue_address: updatedOffer.venue_address || s.venue_address,
            expected_attendance: updatedOffer.expected_attendance || s.expected_attendance,
            age_restriction: updatedOffer.age_restriction || s.age_restriction,
            additional_notes: updatedOffer.additional_notes ? `${s.additional_notes}\n\nPromoter details:\n${updatedOffer.additional_notes}` : s.additional_notes
          } : s);
        }
        const nextShows = [...sPrev, newShow];
        localStorage.setItem('nexus_core_shows_offline', JSON.stringify(nextShows));
        return nextShows;
      });
    }
  };

  const handleAcceptOffer = (offerId: string) => {
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        const newShow: Show = {
          id: `show-offer-${o.id}`,
          created_at: new Date().toISOString(),
          name: o.venue_name,
          date: o.date,
          status: 'Active',
          guarantee_amount: o.guarantee_amount,
          revenue: o.guarantee_amount,
          show_type: o.show_type === 'festival' ? 'festival' : 'headliner',
          band_id: o.band_id,
          city: o.city,
          state_province: o.state_province,
          country: o.country,
          promoter_contact: `${o.promoter_name} (${o.promoter_email})`,
          additional_notes: o.notes || '',
          event_scope: 'single',
          load_in_time: o.load_in_time || '16:00',
          doors_time: o.doors_time || '19:00',
          set_time: o.set_time || '21:00',
          curfew_time: o.curfew_time || '23:30',
          venue_address: o.venue_address || '',
          expected_attendance: o.expected_attendance || '300-700',
          age_restriction: o.age_restriction || 'all'
        };

        setShows(sPrev => {
          if ((sPrev || []).some(s => s.id === newShow.id)) return sPrev;
          const nextShows = [...sPrev, newShow];
          localStorage.setItem('nexus_core_shows_offline', JSON.stringify(nextShows));
          return nextShows;
        });

        triggerNotification(`Offer accepted! Added ${o.venue_name} - ${o.date} to Calendar.`);
        addLog(`Accepted booking proposal of $${o.guarantee_amount} at ${o.venue_name}.`);

        return {
          ...o,
          status: 'accepted',
          last_action_by: 'band'
        };
      }
      return o;
    }));
  };

  const handleDeclineOffer = (offerId: string) => {
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        triggerNotification(`Offer for ${o.venue_name} declined.`);
        addLog(`Declined promoter offer for proposed date ${o.date} at ${o.venue_name}.`);
        return {
          ...o,
          status: 'declined',
          last_action_by: 'band'
        };
      }
      return o;
    }));
  };

  const handleBlockPromoter = (offerId: string) => {
    const targetOffer = offers.find(o => o.id === offerId);
    if (!targetOffer) return;
    
    const promoterId = targetOffer.promoter_id;
    if (!blockedPromoters.includes(promoterId)) {
      setBlockedPromoters(prev => [...prev, promoterId]);
      
      setOffers(prev => prev.map(o => {
        if (o.promoter_id === promoterId && o.status !== 'accepted') {
          return { ...o, status: 'declined', last_action_by: 'band', notes: 'AUTOMATICALLY DECLINED DUE TO PROMOTER BLOCK' };
        }
        return o;
      }));

      triggerNotification(`Promoter ${targetOffer.promoter_name} has been permanently blocked.`);
      addLog(`Blocked promoter ${targetOffer.promoter_name}. All their pending offers were declined and future offers are suppressed.`);
    }
  };

  const handleRenegotiateOffer = (offerId: string, extraNotes: string, targetGuarantee: number) => {
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        triggerNotification(`Counter-offer submitted of $${targetGuarantee}.`);
        addLog(`Submitted counter-offer to promoter for ${o.venue_name} ($${targetGuarantee}).`);
        return {
          ...o,
          status: 'renegotiating',
          guarantee_amount: targetGuarantee,
          renegotiation_notes: extraNotes,
          last_action_by: 'band'
        };
      }
      return o;
    }));
  };

  return {
    offers,
    setOffers,
    blockedPromoters,
    setBlockedPromoters,
    handleCreateOffer,
    handleUpdateOffer,
    handleAcceptOffer,
    handleDeclineOffer,
    handleBlockPromoter,
    handleRenegotiateOffer
  };
}
