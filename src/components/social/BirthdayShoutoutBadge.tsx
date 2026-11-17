import React, { useEffect, useState } from 'react';
import { Cake } from 'lucide-react';
import {
  BIRTHDAY_UPDATED_EVENT,
  resolveEffectiveBirthdayProfile,
  shouldShowBirthdayShoutout,
} from '../../utils/birthdayUtils';

export interface BirthdayShoutoutBadgeProps {
  profile: any;
  currentUserProfile?: any;
  isOwnProfile?: boolean;
  isMutual?: boolean;
  compact?: boolean;
  onSendBirthdayHorns?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  hornsSent?: boolean;
  className?: string;
}

export const BirthdayShoutoutBadge: React.FC<BirthdayShoutoutBadgeProps> = ({
  profile,
  currentUserProfile,
  isOwnProfile = false,
  isMutual = false,
  compact = false,
  onSendBirthdayHorns,
  hornsSent = false,
  className = '',
}) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [localSent, setLocalSent] = useState(false);

  useEffect(() => {
    const handleUpdated = () => setRefreshTick((t) => t + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener(BIRTHDAY_UPDATED_EVENT, handleUpdated);
      window.addEventListener('storage', handleUpdated);
      return () => {
        window.removeEventListener(BIRTHDAY_UPDATED_EVENT, handleUpdated);
        window.removeEventListener('storage', handleUpdated);
      };
    }
  }, []);

  void refreshTick;

  const effectivePrefs = resolveEffectiveBirthdayProfile(profile, currentUserProfile);
  if (!shouldShowBirthdayShoutout(effectivePrefs)) {
    return null;
  }

  const alreadySent = hornsSent || localSent;
  const canSendHorns = !isOwnProfile && isMutual && typeof onSendBirthdayHorns === 'function';

  return (
    <span
      className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}
      data-testid="birthday-shoutout-group"
    >
      <span
        data-testid="birthday-today-badge"
        className={`inline-flex items-center gap-1 rounded-md font-mono font-bold bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 text-amber-200 border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)] shrink-0 whitespace-nowrap ${
          compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
        }`}
      >
        <Cake className={compact ? 'w-2.5 h-2.5 text-amber-300' : 'w-3 h-3 text-amber-300'} />
        <span>🎂 Birthday Today</span>
      </span>

      {canSendHorns && (
        <button
          type="button"
          data-testid="send-birthday-horns-btn"
          disabled={alreadySent}
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (alreadySent) return;
            setLocalSent(true);
            try {
              await onSendBirthdayHorns(e);
            } catch {
              setLocalSent(false);
            }
          }}
          className={`inline-flex items-center gap-1 rounded-md font-mono font-bold transition-all shrink-0 whitespace-nowrap ${
            alreadySent
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 cursor-default'
              : 'bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-400/60 shadow-[0_0_10px_rgba(244,63,94,0.28)] cursor-pointer active:scale-95'
          } ${compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'}`}
          title="Send a one-tap Birthday Horns shoutout"
        >
          {alreadySent ? 'Horns Sent! 🤘' : 'Send Birthday Horns 🤘'}
        </button>
      )}
    </span>
  );
};

export default BirthdayShoutoutBadge;
