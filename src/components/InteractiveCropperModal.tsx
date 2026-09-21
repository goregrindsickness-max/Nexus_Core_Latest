import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Move, RotateCcw, Check, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

interface InteractiveCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  aspectRatio: '1:1' | '3:1';
  onCropComplete: (croppedBase64: string) => void;
  title?: string;
}

export const InteractiveCropperModal: React.FC<InteractiveCropperModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio,
  onCropComplete,
  title = 'Adjust Image'
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Constants for preview dimensions
  const previewWidth = aspectRatio === '1:1' ? 280 : 360;
  const previewHeight = aspectRatio === '1:1' ? 280 : 120;

  // Calculate base dimensions for the image to match cover behavior
  const imgRatio = naturalSize.width && naturalSize.height ? naturalSize.width / naturalSize.height : 1;
  const containerRatio = previewWidth / previewHeight;

  let baseImgWidth = previewWidth;
  let baseImgHeight = previewHeight;

  if (imgRatio > containerRatio) {
    baseImgHeight = previewHeight;
    baseImgWidth = previewHeight * imgRatio;
  } else {
    baseImgWidth = previewWidth;
    baseImgHeight = previewWidth / imgRatio;
  }

  // Reset controls when a new image is loaded
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
      setImgLoaded(true);
    } else {
      setImgLoaded(false);
    }
  }, [imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImgLoaded(true);
  };

  // Mouse & Touch Dragging Handlers
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const onDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    onDrag(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    stopDrag();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    onDrag(touch.clientX, touch.clientY);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.005;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  // Fine-tuning buttons
  const pan = (direction: 'up' | 'down' | 'left' | 'right', amount = 10) => {
    setPosition((prev) => {
      switch (direction) {
        case 'up': return { ...prev, y: prev.y - amount };
        case 'down': return { ...prev, y: prev.y + amount };
        case 'left': return { ...prev, x: prev.x - amount };
        case 'right': return { ...prev, x: prev.x + amount };
      }
    });
  };

  const resetAll = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Crop drawing onto hidden canvas and output optimized base64
  const handleCrop = () => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Define standard output sizes
      if (aspectRatio === '1:1') {
        canvas.width = 400;
        canvas.height = 400;
      } else {
        canvas.width = 1200;
        canvas.height = 400; // 3:1 ratio
      }

      // Backdrop fill
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Determine dimensions to completely cover the canvas area (cover fit)
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;

      let renderWidth = canvas.width;
      let renderHeight = canvas.height;

      if (imgRatio > canvasRatio) {
        renderHeight = canvas.height;
        renderWidth = canvas.height * imgRatio;
      } else {
        renderWidth = canvas.width;
        renderHeight = canvas.width / imgRatio;
      }

      // Move context origin to center of canvas
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // Apply drag offset converted from preview pixel space to canvas coordinate space
      const scaleFactorX = canvas.width / previewWidth;
      const scaleFactorY = canvas.height / previewHeight;
      const canvasOffsetX = position.x * scaleFactorX;
      const canvasOffsetY = position.y * scaleFactorY;
      ctx.translate(canvasOffsetX, canvasOffsetY);

      // Apply zoom factor
      ctx.scale(zoom, zoom);

      // Draw image centered at current offsets
      ctx.drawImage(img, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);

      // Output high-quality optimized JPEG or PNG
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
      onCropComplete(croppedBase64);
      onClose();
    };
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" id="image-cropper-modal">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-100">{title}</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer p-1 rounded-lg hover:bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6 flex flex-col items-center">
          
          {/* Interactive Crop Stage */}
          <div 
            ref={containerRef}
            onWheel={handleWheel}
            className="relative bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden cursor-move flex items-center justify-center select-none shadow-inner"
            style={{ 
              width: `${previewWidth + 40}px`, 
              height: `${previewHeight + 40}px` 
            }}
          >
            {/* Aspect Mask Window */}
            <div 
              className={`absolute overflow-hidden border-2 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] z-10 pointer-events-none ${
                aspectRatio === '1:1' ? 'rounded-full' : 'rounded-lg'
              }`}
              style={{ 
                width: `${previewWidth}px`, 
                height: `${previewHeight}px` 
              }}
            />

            {/* Dark Surrounding Overlays (Vignette style outside crop window) */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />

            {/* Active Image */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={stopDrag}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={stopDrag}
              className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop Target"
                onLoad={handleImageLoad}
                className="pointer-events-none max-w-none origin-center flex-shrink-0"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  width: `${baseImgWidth}px`,
                  height: `${baseImgHeight}px`,
                  opacity: imgLoaded ? 1 : 0,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out, opacity 0.2s ease-in'
                }}
              />
            </div>

            {/* Loading Indicator */}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-20">
                <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
              </div>
            )}
          </div>

          <p className="text-[10px] text-zinc-500 text-center font-mono uppercase tracking-wider">
            Drag to reposition • Scroll or use slider to zoom
          </p>

          {/* Controls Panel */}
          <div className="w-full space-y-4 pt-2 border-t border-zinc-900">
            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase font-bold text-zinc-400">
                <span className="flex items-center gap-1"><ZoomOut className="w-3.5 h-3.5 text-zinc-500" /> Zoom Level</span>
                <span className="text-rose-400 font-bold">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
                  className="p-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-rose-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
                  className="p-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Fine-Tuning D-Pad Controls */}
            <div className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
              <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-zinc-500" /> Fine Position
              </div>
              <div className="flex items-center gap-1.5">
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button
                    type="button"
                    onClick={() => pan('up')}
                    className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <div />

                  <button
                    type="button"
                    onClick={() => pan('left')}
                    className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                    title="Move Left"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="p-1 bg-zinc-900 hover:bg-rose-950/40 hover:border-rose-500/30 border border-zinc-800 rounded text-zinc-400 hover:text-rose-400 flex items-center justify-center cursor-pointer"
                    title="Reset to Center"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => pan('right')}
                    className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                    title="Move Right"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div />
                  <button
                    type="button"
                    onClick={() => pan('down')}
                    className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <div />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-zinc-900 bg-zinc-950/80">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[11px] font-black uppercase font-mono tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={!imgLoaded}
            className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black uppercase font-mono tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Crop
          </button>
        </div>

      </div>
    </div>
  );
};
