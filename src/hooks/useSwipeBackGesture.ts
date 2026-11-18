import { useEffect, useState } from 'react';
import {
  evaluateSwipeBackGesture,
  hasAnyBackHandlerAvailable,
  shouldIgnoreSwipeBackTarget,
  triggerTopBackHandler,
} from '../utils/swipeBackRegistry';

export interface SwipeBackVisualState {
  active: boolean;
  progress: number;
  ready: boolean;
}

const INITIAL_STATE: SwipeBackVisualState = {
  active: false,
  progress: 0,
  ready: false,
};

/**
 * Global touch listener that enables swiping right to navigate back across tabs,
 * profile overlays, drawers, and modals without interfering with vertical scroll or carousels.
 */
export function useSwipeBackGesture(enabled = true): SwipeBackVisualState {
  const [visualState, setVisualState] = useState<SwipeBackVisualState>(INITIAL_STATE);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let tracking = false;
    let lockedHorizontal = false;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastX = 0;
    let lastY = 0;
    let prevReady = false;

    const reset = () => {
      tracking = false;
      lockedHorizontal = false;
      prevReady = false;
      setVisualState((prev) => (prev.active ? INITIAL_STATE : prev));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        reset();
        return;
      }

      const touch = e.touches[0];
      if (!hasAnyBackHandlerAvailable()) {
        tracking = false;
        return;
      }

      if (shouldIgnoreSwipeBackTarget(e.target, touch.clientX)) {
        tracking = false;
        return;
      }

      tracking = true;
      lockedHorizontal = false;
      prevReady = false;
      startX = touch.clientX;
      startY = touch.clientY;
      lastX = touch.clientX;
      lastY = touch.clientY;
      startTime = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      if (e.touches.length !== 1) {
        reset();
        return;
      }

      const touch = e.touches[0];
      lastX = touch.clientX;
      lastY = touch.clientY;

      const dx = lastX - startX;
      const dy = lastY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!lockedHorizontal) {
        if (dx < -10 || (absDy > 14 && absDy >= absDx)) {
          // User is swiping left or scrolling vertically — yield cleanly
          reset();
          return;
        }
        if (dx >= 18 && dx > absDy * 1.55) {
          lockedHorizontal = true;
        } else {
          return;
        }
      }

      if (dx <= 0) {
        setVisualState((prev) => (prev.active ? INITIAL_STATE : prev));
        return;
      }

      const evalRes = evaluateSwipeBackGesture({
        startX,
        currentX: lastX,
        deltaY: dy,
        elapsedMs: Date.now() - startTime,
      });

      const ready = evalRes.shouldTrigger || evalRes.progress >= 1;
      if (ready && !prevReady) {
        try {
          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(8);
          }
        } catch {}
      }
      prevReady = ready;

      setVisualState({
        active: true,
        progress: evalRes.progress,
        ready,
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      const touch = e.changedTouches?.[0];
      const endX = touch ? touch.clientX : lastX;
      const endY = touch ? touch.clientY : lastY;
      const elapsedMs = Date.now() - startTime;

      const evalRes = evaluateSwipeBackGesture({
        startX,
        currentX: endX,
        deltaY: endY - startY,
        elapsedMs,
      });

      const shouldFire = evalRes.shouldTrigger && (lockedHorizontal || evalRes.progress >= 1);
      reset();

      if (shouldFire) {
        triggerTopBackHandler();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', reset, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', reset);
    };
  }, [enabled]);

  return visualState;
}
