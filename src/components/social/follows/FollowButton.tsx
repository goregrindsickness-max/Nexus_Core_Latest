import React, { useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

export interface FollowButtonProps {
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
  isFollowed = false,
  onToggleFollow,
  isLoading = false,
  size = 'sm',
  variant = 'solid',
  className = '',
  followText = 'Follow',
  followingText = 'Following',
  showIcon = true,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || internalLoading || !onToggleFollow) return;
    try {
      setInternalLoading(true);
      await onToggleFollow();
    } catch (err) {
      console.warn('Follow action failed:', err);
    } finally {
      setInternalLoading(false);
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
  const variantClasses = isFollowed
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
      ) : isFollowed ? (
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
