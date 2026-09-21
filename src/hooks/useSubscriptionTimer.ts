import { useState, useEffect, useCallback } from 'react';

export interface UseSubscriptionTimerReturn {
  activePlan: string;
  setActivePlan: React.Dispatch<React.SetStateAction<string>>;
  trialStartTime: number;
  currentTime: Date;
  getTrialCountdownStr: () => string;
  isTrialExpired: boolean;
}

export function useSubscriptionTimer(): UseSubscriptionTimerReturn {
  const [activePlan, setActivePlan] = useState<string>(() => {
    try {
      return localStorage.getItem('nexus_core_active_plan') || '';
    } catch (_) {
      return '';
    }
  });

  const [trialStartTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tally_trial_start_time');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (_) {}

    // Set fallback start point
    const now = Date.now();
    try {
      localStorage.setItem('tally_trial_start_time', now.toString());
    } catch (_) {}
    return now;
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTrialCountdownStr = useCallback(() => {
    if (activePlan === 'touring-pro' || activePlan === 'touring-pro-plus') {
      try {
        const isPromoGated = localStorage.getItem('nexus_core_promo_gated') === 'true';
        if (isPromoGated) {
          const yearInMs = 365 * 24 * 60 * 60 * 1000;
          const endTime = trialStartTime + yearInMs;
          const timeLeft = Math.max(0, endTime - currentTime.getTime());
          if (timeLeft <= 0) return "Expired (1 Year)";

          const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
          const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          return `${days}d ${hours}h Promo`;
        }
      } catch (_) {}
      return "Active (No Exp.)";
    }
    const trialDurationMs = 14 * 24 * 60 * 60 * 1000; // 14 days
    const endTime = trialStartTime + trialDurationMs;
    const timeLeft = Math.max(0, endTime - currentTime.getTime());

    if (timeLeft <= 0) {
      return "Expired";
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, [activePlan, trialStartTime, currentTime]);

  const isTrialExpired = getTrialCountdownStr().startsWith("Expired");

  return {
    activePlan,
    setActivePlan,
    trialStartTime,
    currentTime,
    getTrialCountdownStr,
    isTrialExpired,
  };
}
