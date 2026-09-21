import React from 'react';
import { CreditCard, Globe, ExternalLink, Copy } from 'lucide-react';
import { UserProfile } from '../../../types';
import StripeConnectPayoutSection from '../../StripeConnectPayoutSection';

interface PromoterSettingsProps {
  ticketingEventId?: string;
  triggerNotification?: (msg: string) => void;
  playLocalBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
  userProfile?: UserProfile | null;
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

export default function PromoterSettings({
  ticketingEventId = 'demo-sandbox',
  triggerNotification = (msg) => console.log(msg),
  playLocalBeep = () => {},
  userProfile = null,
  setUserProfile
}: PromoterSettingsProps) {
  const shopLink = `${window.location.origin}/pay?show_id=${ticketingEventId}`;

  return (
    <div className="space-y-6 p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl font-mono text-zinc-300">
      {/* Stripe Connect Payouts */}
      <StripeConnectPayoutSection
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        triggerNotification={triggerNotification}
        role="promoter"
        theme="green"
        clearanceLevel={5}
      />

      {/* Public Storefront URI */}
      <div className="space-y-3 border-t border-zinc-900/80 pt-4">
        <div className="space-y-1">
          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider block">
            🌐 Public Venue Storefront Gateway URI
          </span>
          <p className="text-[11px] text-zinc-400 font-sans leading-normal">
            Distribute this direct customer shopping URL on digital collateral, tickets, and official band media channels to enable immediate self-checkout.
          </p>
        </div>

        <div className="w-full bg-black/80 border border-zinc-900 p-3 rounded-xl overflow-x-auto">
          <span className="text-xs text-yellow-500/90 font-mono block whitespace-nowrap leading-none select-all">
            {shopLink}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(shopLink);
              if (triggerNotification) triggerNotification('📋 Storefront URL copied to clipboard!');
              if (playLocalBeep) playLocalBeep(880, 'sine', 0.05);
            }}
            className="flex-1 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-mono uppercase font-black rounded-lg tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>COPY POS STOREFRONT LINK</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.open(shopLink, '_blank');
              if (playLocalBeep) playLocalBeep(980, 'sine', 0.05);
            }}
            className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[10px] font-mono uppercase font-black rounded-lg tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>VISIT PUBLIC GATEWAY</span>
          </button>
        </div>
      </div>
    </div>
  );
}
