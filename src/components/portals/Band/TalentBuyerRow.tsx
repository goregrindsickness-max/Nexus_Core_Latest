import React, { useState, useEffect } from 'react';
import { getSupabase } from '../../../supabase';

interface TalentBuyerRowProps {
  buyerName: string;
  venueEmail: string;
  venueName: string;
  onBuyerClick: (promoter: { name: string; email: string; venue: string; avatar: string }) => void;
  triggerNotification?: (msg: string) => void;
}

export default function TalentBuyerRow({
  buyerName,
  venueEmail,
  venueName,
  onBuyerClick,
  triggerNotification
}: TalentBuyerRowProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [promoterProfile, setPromoterProfile] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const verifyPromoter = async () => {
      setIsLoading(true);
      // Fallback verification for mock promoters
      const mockVerifiedNames = ['Lizzy & Mark', 'Jon', 'Lynn', 'Evan'];
      if ((mockVerifiedNames || []).some(name => buyerName.toLowerCase().includes(name.toLowerCase()))) {
        setIsVerified(true);
        setPromoterProfile({
          full_name: buyerName,
          email: venueEmail,
          avatar_url: null
        });
      }

      const supabase = getSupabase();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.eq."${venueEmail}",full_name.eq."${buyerName}"`);

        if (!error && data && data.length > 0 && active) {
          setIsVerified(true);
          setPromoterProfile(data[0]);
        }
      } catch (err) {
        console.error("TalentBuyerRow: Verification query failed:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    verifyPromoter();
    return () => { active = false; };
  }, [buyerName, venueEmail]);

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isVerified) {
      // Suppress default navigation and invoke drawer
      const initials = buyerName
        .split('&')
        .map(n => n.trim().charAt(0))
        .join('')
        .toUpperCase();
        
      onBuyerClick({
        name: promoterProfile?.full_name || buyerName,
        email: promoterProfile?.email || venueEmail,
        venue: venueName,
        avatar: initials || 'P'
      });
    } else if (triggerNotification) {
      triggerNotification("⚠️ Talent buyer is not registered on the native network yet.");
    }
  };

  if (isVerified) {
    return (
      <span
        onClick={handleLinkClick}
        className="text-purple-400 font-bold hover:text-purple-300 underline underline-offset-2 cursor-pointer flex items-center space-x-1.5 select-none"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />
        <span>{buyerName}</span>
      </span>
    );
  }

  return (
    <span className="text-purple-300 font-bold font-sans">
      {buyerName || 'Booking Dept.'}
    </span>
  );
}
