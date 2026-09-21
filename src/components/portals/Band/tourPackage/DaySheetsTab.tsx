import React from 'react';
import { Copy, FileText } from 'lucide-react';
import { TourPackageStop } from '../TourManagerPackageModule';

interface DaySheetsTabProps {
  stops: TourPackageStop[];
  selectedStopId: string;
  setSelectedStopId: (id: string) => void;
  onCopyDaySheet: (stop: TourPackageStop) => void;
  daySheetText: string;
}

export const DaySheetsTab: React.FC<DaySheetsTabProps> = ({
  stops,
  selectedStopId,
  setSelectedStopId,
  onCopyDaySheet,
  daySheetText
}) => {
  const activeStop = stops.find(s => s.id === selectedStopId) || stops[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase font-mono">Select Stop for Day Sheet:</span>
          <select
            value={selectedStopId}
            onChange={e => setSelectedStopId(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-white text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            {stops.map(s => (
              <option key={s.id} value={s.id}>
                {s.date} - {s.venueName} ({s.city}, {s.state})
              </option>
            ))}
          </select>
        </div>

        {activeStop && (
          <button
            type="button"
            onClick={() => onCopyDaySheet(activeStop)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy to Clipboard (SMS/WhatsApp)
          </button>
        )}
      </div>

      {activeStop && (
        <div className="bg-black border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner text-left">
          {daySheetText}
        </div>
      )}
    </div>
  );
};
