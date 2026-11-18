import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerBackHandler,
  triggerTopBackHandler,
  hasAnyBackHandlerAvailable,
  clearBackHandlersForTest,
  evaluateSwipeBackGesture,
} from '../utils/swipeBackRegistry';

describe('swipeBackRegistry & gesture evaluation', () => {
  beforeEach(() => {
    clearBackHandlersForTest();
  });

  describe('priority and LIFO back handler stack', () => {
    it('executes higher-priority handlers before lower-priority ones', () => {
      const calls: string[] = [];

      registerBackHandler('app-root', {
        priority: 0,
        canGoBack: () => true,
        goBack: () => calls.push('app-root'),
      });

      registerBackHandler('social-tabs', {
        priority: 10,
        canGoBack: () => true,
        goBack: () => calls.push('social-tabs'),
      });

      registerBackHandler('inbox-terminal', {
        priority: 15,
        canGoBack: () => true,
        goBack: () => calls.push('inbox-terminal'),
      });

      registerBackHandler('social-overlays', {
        priority: 20,
        canGoBack: () => true,
        goBack: () => calls.push('social-overlays'),
      });

      expect(hasAnyBackHandlerAvailable()).toBe(true);
      expect(triggerTopBackHandler()).toBe(true);
      expect(calls).toEqual(['social-overlays']);
    });

    it('falls through to outer handlers when inner handlers have canGoBack() === false', () => {
      const calls: string[] = [];

      registerBackHandler('app-root', {
        priority: 0,
        canGoBack: () => true,
        goBack: () => calls.push('app-root'),
      });

      registerBackHandler('social-overlays', {
        priority: 20,
        canGoBack: () => false,
        goBack: () => calls.push('social-overlays'),
      });

      registerBackHandler('inbox-terminal', {
        priority: 15,
        canGoBack: () => true,
        goBack: () => calls.push('inbox-terminal'),
      });

      expect(triggerTopBackHandler()).toBe(true);
      expect(calls).toEqual(['inbox-terminal']);
    });

    it('uses LIFO ordering for handlers with equal priority', () => {
      const calls: string[] = [];

      registerBackHandler('first-modal', {
        priority: 20,
        canGoBack: () => true,
        goBack: () => calls.push('first-modal'),
      });

      registerBackHandler('second-modal', {
        priority: 20,
        canGoBack: () => true,
        goBack: () => calls.push('second-modal'),
      });

      expect(triggerTopBackHandler()).toBe(true);
      expect(calls).toEqual(['second-modal']);
    });

    it('removes handler on cleanup and updates availability cleanly', () => {
      const goBackSpy = vi.fn();
      const unregister = registerBackHandler('temp-overlay', {
        priority: 20,
        canGoBack: () => true,
        goBack: goBackSpy,
      });

      expect(hasAnyBackHandlerAvailable()).toBe(true);
      unregister();
      expect(hasAnyBackHandlerAvailable()).toBe(false);
      expect(triggerTopBackHandler()).toBe(false);
      expect(goBackSpy).not.toHaveBeenCalled();
    });

    it('re-registering the same id updates the handler without leaving duplicates', () => {
      const firstSpy = vi.fn();
      const secondSpy = vi.fn();

      registerBackHandler('app-root', {
        priority: 0,
        canGoBack: () => true,
        goBack: firstSpy,
      });

      registerBackHandler('app-root', {
        priority: 0,
        canGoBack: () => true,
        goBack: secondSpy,
      });

      expect(triggerTopBackHandler()).toBe(true);
      expect(firstSpy).not.toHaveBeenCalled();
      expect(secondSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('evaluateSwipeBackGesture thresholds', () => {
    it('triggers on left-edge rightward swipe >= 56px', () => {
      const res = evaluateSwipeBackGesture({
        startX: 20,
        currentX: 80,
        deltaY: 6,
        elapsedMs: 320,
      });
      expect(res.thresholdPx).toBe(56);
      expect(res.shouldTrigger).toBe(true);
      expect(res.progress).toBe(1);
    });

    it('triggers on fast left-edge flick (>= 40px within <= 260ms)', () => {
      const res = evaluateSwipeBackGesture({
        startX: 24,
        currentX: 66,
        deltaY: 4,
        elapsedMs: 180,
      });
      expect(res.shouldTrigger).toBe(true);
    });

    it('requires 82px when starting from mid-screen', () => {
      const shortMid = evaluateSwipeBackGesture({
        startX: 120,
        currentX: 185,
        deltaY: 5,
        elapsedMs: 250,
      });
      expect(shortMid.thresholdPx).toBe(82);
      expect(shortMid.shouldTrigger).toBe(false);

      const validMid = evaluateSwipeBackGesture({
        startX: 120,
        currentX: 210,
        deltaY: 10,
        elapsedMs: 300,
      });
      expect(validMid.shouldTrigger).toBe(true);
    });

    it('rejects leftward swipes, vertical scrolling, excessive vertical drift, and stale drags', () => {
      // Leftward swipe
      expect(
        evaluateSwipeBackGesture({
          startX: 180,
          currentX: 80,
          deltaY: 0,
          elapsedMs: 200,
        }).shouldTrigger
      ).toBe(false);

      // Diagonal/vertical scroll bias (dx <= abs(deltaY) * 1.65)
      expect(
        evaluateSwipeBackGesture({
          startX: 20,
          currentX: 85,
          deltaY: 50,
          elapsedMs: 250,
        }).shouldTrigger
      ).toBe(false);

      // Excessive vertical drift (> 75px)
      expect(
        evaluateSwipeBackGesture({
          startX: 20,
          currentX: 220,
          deltaY: 85,
          elapsedMs: 300,
        }).shouldTrigger
      ).toBe(false);

      // Stale slow drag (> 900ms)
      expect(
        evaluateSwipeBackGesture({
          startX: 20,
          currentX: 140,
          deltaY: 0,
          elapsedMs: 1100,
        }).shouldTrigger
      ).toBe(false);
    });
  });
});
