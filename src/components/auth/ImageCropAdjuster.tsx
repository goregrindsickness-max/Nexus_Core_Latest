import React, { useState } from 'react';

interface SingleCropAdjusterProps {
  label: string;
  type: 'avatar' | 'banner';
  imageUrl: string;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  posX: number;
  setPosX: React.Dispatch<React.SetStateAction<number>>;
  posY: number;
  setPosY: React.Dispatch<React.SetStateAction<number>>;
  baseWidth: number;
  baseHeight: number;
  isDragging: boolean;
  setIsDragging: (b: boolean) => void;
  setNaturalSize: (size: { width: number; height: number }) => void;
  onFileSelect: (file: File) => void;
  accentColor?: 'emerald' | 'purple';
  disabled?: boolean;
}

export const SingleCropAdjuster: React.FC<SingleCropAdjusterProps> = ({
  label,
  type,
  imageUrl,
  scale,
  setScale,
  posX,
  setPosX,
  posY,
  setPosY,
  baseWidth,
  baseHeight,
  isDragging,
  setIsDragging,
  setNaturalSize,
  onFileSelect,
  accentColor = 'emerald',
  disabled = false
}) => {
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number; dist?: number } | null>(null);

  const isDefaultAvatar = imageUrl === 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20Circuits.png';

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setLastTouch({ x: 0, y: 0, dist });
    } else if (e.touches.length === 1) {
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !lastTouch) return;
    if (e.touches.length === 2 && lastTouch.dist) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const scaleChange = dist / lastTouch.dist;
      setScale(s => Math.max(0.5, Math.min(3, s * scaleChange)));
      setLastTouch({ ...lastTouch, dist });
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouch.x;
      const dy = e.touches[0].clientY - lastTouch.y;
      setPosX(p => p + dx);
      setPosY(p => p + dy);
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setLastTouch(null);
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    const delta = -e.deltaY * 0.001;
    setScale(s => Math.max(0.5, Math.min(3, s + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setLastTouch({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || !lastTouch || !isDragging) return;
    const dx = e.clientX - lastTouch.x;
    const dy = e.clientY - lastTouch.y;
    setPosX(p => p + dx);
    setPosY(p => p + dy);
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (disabled) return;
    setLastTouch(null);
    setIsDragging(false);
  };

  const borderClass = disabled
    ? 'border-zinc-800'
    : accentColor === 'purple' ? 'border-purple-900/40 hover:border-purple-500/80' : 'border-emerald-900/40 hover:border-emerald-500/80';
  const labelColor = disabled ? 'text-zinc-500' : (accentColor === 'purple' ? 'text-purple-500' : 'text-emerald-500');
  const accentRange = accentColor === 'purple' ? 'accent-purple-500' : 'accent-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className={`block text-[10px] font-mono tracking-wider ${labelColor} uppercase flex items-center gap-1.5`}>
          {label}
          {disabled && <span className="text-[9px] text-amber-400 font-normal lowercase">(read-only in workspace setup)</span>}
        </label>
      </div>
      <div 
        className={`relative w-full ${type === 'avatar' ? 'h-[200px]' : 'h-[180px]'} bg-zinc-950 rounded-xl border ${borderClass} transition-colors flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] select-none ${disabled ? 'cursor-default opacity-85' : 'cursor-grab active:cursor-grabbing'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {imageUrl && !isDefaultAvatar ? (
          <img 
            src={imageUrl}
            onLoad={(e) => {
              setNaturalSize({
                width: (e.target as HTMLImageElement).naturalWidth,
                height: (e.target as HTMLImageElement).naturalHeight
              });
            }}
            className="pointer-events-none max-w-none origin-center flex-shrink-0" 
            style={{ 
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              transform: `translate3d(${posX}px, ${posY}px, 0) scale(${scale})`, 
              transition: isDragging ? 'none' : 'transform 0.1s ease-out' 
            }}
            alt={label} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-2 pointer-events-none">
            <span className="text-3xl drop-shadow-md">{type === 'avatar' ? '📸' : '🌌'}</span>
            <span className="text-[10px] text-zinc-600 font-mono font-bold tracking-wider">
              {type === 'avatar' ? 'NO AVATAR SET' : 'NO BANNER SET'}
            </span>
          </div>
        )}
        {!disabled ? (
          <>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
              }}
              className="absolute top-0 right-0 w-8 h-8 opacity-0 cursor-pointer z-10" 
              title="Upload New"
            />
            <div className="absolute top-2 right-2 z-0 pointer-events-none bg-black/50 p-1.5 rounded text-[8px] font-mono text-white">REPLACE</div>
          </>
        ) : (
          <div className="absolute top-2 right-2 z-10 pointer-events-none bg-zinc-900/90 border border-zinc-700/50 px-2 py-1 rounded text-[8px] font-mono text-amber-300 flex items-center gap-1">
            <span>🔒</span> READ ONLY
          </div>
        )}
      </div>

      {imageUrl && !isDefaultAvatar && !disabled && (
        <div className="flex justify-between items-center px-2 mt-1">
          <div className="flex items-center space-x-2 flex-grow mr-4">
            <span className="text-[9px] font-mono text-zinc-500">ZOOM:</span>
            <input 
              type="range" 
              min="0.5" 
              max="3" 
              step="0.05" 
              value={scale} 
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${accentRange}`}
            />
            <span className={`text-[9px] font-mono ${labelColor} min-w-[30px] text-right`}>{Math.round(scale * 100)}%</span>
          </div>
          <button
            type="button"
            onClick={() => { setScale(1); setPosX(0); setPosY(0); }}
            className="text-[8px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider border border-zinc-800 px-1.5 py-0.5 rounded hover:bg-zinc-900 transition-colors"
          >
            RESET
          </button>
        </div>
      )}
    </div>
  );
};
