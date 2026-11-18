export interface BackHandlerEntry {
  id: string;
  priority?: number;
  canGoBack: () => boolean;
  goBack: () => void;
}

const backHandlerStack: BackHandlerEntry[] = [];

function getOrderedHandlers(): BackHandlerEntry[] {
  // Higher priority first; for equal priority, most recently registered (LIFO) first
  return backHandlerStack
    .map((entry, idx) => ({ entry, idx }))
    .sort((a, b) => {
      const pDiff = (b.entry.priority ?? 0) - (a.entry.priority ?? 0);
      return pDiff !== 0 ? pDiff : b.idx - a.idx;
    })
    .map((item) => item.entry);
}

/**
 * Registers a back-navigation handler. Higher-priority / later (inner) views take precedence over
 * outer views when `canGoBack()` returns `true`.
 */
export function registerBackHandler(
  id: string,
  handler: Omit<BackHandlerEntry, 'id'>
): () => void {
  const existingIdx = backHandlerStack.findIndex((entry) => entry.id === id);
  if (existingIdx >= 0) {
    backHandlerStack.splice(existingIdx, 1);
  }

  const entry: BackHandlerEntry = { id, ...handler };
  backHandlerStack.push(entry);

  return () => {
    const idx = backHandlerStack.indexOf(entry);
    if (idx >= 0) {
      backHandlerStack.splice(idx, 1);
    }
  };
}

export function clearBackHandlersForTest(): void {
  backHandlerStack.length = 0;
}

export function hasAnyBackHandlerAvailable(): boolean {
  for (const entry of getOrderedHandlers()) {
    try {
      if (entry.canGoBack()) {
        return true;
      }
    } catch {
      // Ignore faulty handler check
    }
  }
  return false;
}

/**
 * Invokes the highest-priority registered back handler whose `canGoBack()` returns `true`.
 * Returns `true` if navigation was handled, `false` otherwise.
 */
export function triggerTopBackHandler(): boolean {
  for (const entry of getOrderedHandlers()) {
    try {
      if (entry.canGoBack()) {
        entry.goBack();
        return true;
      }
    } catch {
      // Continue trying outer handlers if an inner handler fails
    }
  }
  return false;
}

const INTERACTIVE_INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'VIDEO']);

/**
 * Returns `true` if a touch starting at `target` belongs to a text field, map canvas,
 * custom horizontal swipe widget, or horizontally scrolled strip that should own horizontal drags.
 */
export function shouldIgnoreSwipeBackTarget(
  target: EventTarget | null,
  startX?: number
): boolean {
  if (!target || typeof HTMLElement === 'undefined') return false;
  let el: HTMLElement | null =
    target instanceof HTMLElement
      ? target
      : (target as Node)?.parentElement || null;

  const isEdgeStart = typeof startX === 'number' && startX <= 44;

  while (el && el !== document.body && el !== document.documentElement) {
    if (INTERACTIVE_INPUT_TAGS.has(el.tagName)) {
      return true;
    }
    if (el.isContentEditable) {
      return true;
    }
    if (
      el.dataset?.noSwipeBack === 'true' ||
      el.getAttribute('role') === 'slider' ||
      el.classList?.contains('mapboxgl-map') ||
      el.classList?.contains('mapboxgl-canvas')
    ) {
      return true;
    }

    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      const style = window.getComputedStyle(el);
      const overflowX = style.overflowX;
      if (
        (overflowX === 'auto' || overflowX === 'scroll') &&
        el.scrollWidth > el.clientWidth + 6
      ) {
        // Allow edge swipes when a horizontal container is already scrolled all the way left;
        // otherwise let the user scroll left cleanly without triggering Back.
        if (!isEdgeStart || el.scrollLeft > 2) {
          return true;
        }
      }
    }

    el = el.parentElement;
  }

  return false;
}

export interface SwipeBackEvaluation {
  shouldTrigger: boolean;
  progress: number;
  thresholdPx: number;
}

/**
 * Evaluates whether a rightward touch swipe qualifies to trigger "go back".
 */
export function evaluateSwipeBackGesture(params: {
  startX: number;
  currentX: number;
  deltaY: number;
  elapsedMs: number;
}): SwipeBackEvaluation {
  const dx = params.currentX - params.startX;
  const absDy = Math.abs(params.deltaY);
  const isEdgeSwipe = params.startX <= 56;
  const thresholdPx = isEdgeSwipe ? 56 : 82;

  if (dx <= 0 || absDy > 75 || params.elapsedMs > 900) {
    return { shouldTrigger: false, progress: 0, thresholdPx };
  }

  const horizontalRatioOk = dx > absDy * 1.65;
  const progress = Math.max(0, Math.min(1, dx / thresholdPx));
  const quickFlickOk = isEdgeSwipe && dx >= 40 && params.elapsedMs <= 260 && horizontalRatioOk;
  const shouldTrigger = horizontalRatioOk && (dx >= thresholdPx || quickFlickOk);

  return { shouldTrigger, progress, thresholdPx };
}
