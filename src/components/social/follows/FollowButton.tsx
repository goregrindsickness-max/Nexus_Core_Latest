import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import {
  isProfileFollowedGlobally,
  saveFollowStateGlobally,
  FOLLOW_EVENT_NAME,
  getTargetFollowKeys,
} from '../../../utils/followSyncService';

export interface FollowButtonProps {
  targetProfile?: any;
  target?: any;
  isFollowed?: boolean;
  onToggleFollow?: () => Promise<void> | void;
  isLoading?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost' | 'pill';
  className?: string;
  followText?: string;
  followingText?: string;
  showIcon?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetProfile,
  target,
  isFollowed: propIsFollowed = false,
  onToggleFollow,
  isLoading = false,
  size = 'sm',
  variant = 'solid',
  className = '',
  followText = 'Follow',
  followingText = 'Following',
  showIcon = true,
}) => {
  const activeTarget = targetProfile || target;
  const [internalLoading, setInternalLoading] = useState(false);

  const computeIsFollowed = useCallback(() => {
    if (activeTarget) {
      return isProfileFollowedGlobally(activeTarget);
    }
    return propIsFollowed;
  }, [activeTarget, propIsFollowed]);

  const [currentIsFollowed, setCurrentIsFollowed] = useState<boolean>(computeIsFollowed);

  // Sync state whenever prop or target changes
  useEffect(() => {
    setCurrentIsFollowed(computeIsFollowed());
  }, [computeIsFollowed]);

  // Listen to global follow update events app-wide
  useEffect(() => {
    const handleFollowUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) {
        setCurrentIsFollowed(computeIsFollowed());
        return;
      }

      if (activeTarget) {
        const myKeys = getTargetFollowKeys(activeTarget);
        const eventKeys: string[] = detail.keys || getTargetFollowKeys(detail.target);
        if (myKeys.some(k => eventKeys.includes(k))) {
          setCurrentIsFollowed(Boolean(detail.isFollowed));
        }
      } else {
        setCurrentIsFollowed(computeIsFollowed());
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(FOLLOW_EVENT_NAME, handleFollowUpdated);
      window.addEventListener('storage', handleFollowUpdated);
      return () => {
        window.removeEventListener(FOLLOW_EVENT_NAME, handleFollowUpdated);
        window.removeEventListener('storage', handleFollowUpdated);
      };
    }
  }, [activeTarget, computeIsFollowed]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || internalLoading) return;
    
    const nextState = !currentIsFollowed;
    setCurrentIsFollowed(nextState);

    if (activeTarget) {
      saveFollowStateGlobally(activeTarget, nextState);
    }

    if (onToggleFollow) {
      try {
        setInternalLoading(true);
        await onToggleFollow();
      } catch (err) {
        console.warn('Follow action failed:', err);
        // Rollback on error
        setCurrentIsFollowed(!nextState);
        if (activeTarget) {
          saveFollowStateGlobally(activeTarget, !nextState);
        }
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const busy = isLoading || internalLoading;

  // Size styling
  const sizeClasses = {
    xs: 'px-2 py-1 text-[10px] gap-1',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  }[size];

  // Variant styling
  const variantClasses = currentIsFollowed
    ? variant === 'outline'
      ? 'border border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500'
      : variant === 'ghost'
      ? 'text-emerald-400 hover:bg-emerald-950/30'
      : 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
    : variant === 'outline'
    ? 'border border-purple-500/40 text-purple-300 bg-purple-950/20 hover:bg-purple-950/50 hover:border-purple-500'
    : variant === 'ghost'
    ? 'text-purple-400 hover:bg-purple-950/30'
    : 'bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-sm shadow-purple-900/50';

  const roundedClass = variant === 'pill' ? 'rounded-full' : 'rounded-lg';

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`font-mono font-bold inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${roundedClass} ${className}`}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : currentIsFollowed ? (
        <>
          {showIcon && <UserCheck className="w-3.5 h-3.5 shrink-0" />}
          <span>{followingText}</span>
        </>
      ) : (
        <>
          {showIcon && <UserPlus className="w-3.5 h-3.5 shrink-0" />}
          <span>{followText}</span>
        </>
      )}
    </button>
  );
};
