import { useState, useRef, useCallback, useEffect } from 'react';

export interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

export function usePinchZoom(options: UsePinchZoomOptions = {}) {
  const minScale = options.minScale ?? 1;
  const maxScale = options.maxScale ?? 4;
  const [scale, setScale] = useState(options.initialScale ?? 1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const touchStartDistRef = useRef<number>(0);
  const touchStartScaleRef = useRef<number>(1);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);

  const reset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  const zoomIn = useCallback((delta = 0.5) => {
    setScale(s => {
      const next = Math.min(maxScale, +(s + delta).toFixed(2));
      return next;
    });
  }, [maxScale]);

  const zoomOut = useCallback((delta = 0.5) => {
    setScale(s => {
      const next = Math.max(minScale, +(s - delta).toFixed(2));
      if (next <= 1.05) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  }, [minScale]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers: pinch gesture
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      // Double tap detector
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (scale > 1.2) {
          reset();
        } else {
          setScale(2.5);
          setPan({ x: 0, y: 0 });
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Single finger pan when zoomed in
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      const nextScale = Math.min(Math.max(minScale, +(touchStartScaleRef.current * ratio).toFixed(2)), maxScale);
      setScale(nextScale);
      if (nextScale <= 1.05) {
        setPan({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const deltaX = e.touches[0].clientX - dragStartRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartRef.current.y;
      setPan({ x: deltaX, y: deltaY });
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = 0;
    setIsDragging(false);
    if (scale <= 1.05) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setPan({ x: deltaX, y: deltaY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setScale(s => {
      const next = Math.min(maxScale, Math.max(minScale, +(s * zoomFactor).toFixed(2)));
      if (next <= 1.05) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleDoubleClick = () => {
    if (scale > 1.2) {
      reset();
    } else {
      setScale(2.5);
      setPan({ x: 0, y: 0 });
    }
  };

  return {
    scale,
    setScale,
    pan,
    setPan,
    isDragging,
    reset,
    zoomIn,
    zoomOut,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleDoubleClick,
    containerProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel,
      onDoubleClick: handleDoubleClick,
    },
    imageStyle: {
      transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`,
      transition: isDragging ? 'none' : 'transform 0.15s ease-out',
      touchAction: scale > 1 ? 'none' : 'pan-y',
    }
  };
}
