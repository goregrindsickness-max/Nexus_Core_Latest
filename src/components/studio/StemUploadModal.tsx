import React, { useState } from 'react';
import { X, Upload, Music, FileAudio, Layers } from 'lucide-react';

interface StemUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { title: string; track_role?: string; file: File | string; notes?: string }) => void;
  targetStemId?: string | null;
  targetStemTitle?: string;
}

export const StemUploadModal: React.FC<StemUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  targetStemId,
  targetStemTitle
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStemId && !title.trim()) return;
    if (!selectedFile && !fileUrlInput.trim()) return;

    setUploading(true);
    onUpload({
      title: title.trim() || targetStemTitle || 'Audio Stem',
      file: selectedFile || fileUrlInput.trim(),
      notes: notes.trim()
    });
    setUploading(false);
    setTitle('');
    setNotes('');
    setSelectedFile(null);
    setFileUrlInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-[#0c0812] border border-violet-900/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />

        <div className="flex items-center justify-between pb-4 border-b border-violet-900/40 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                {targetStemId ? `Upload New Version: ${targetStemTitle}` : 'Transmit New Stem Track'}
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Supports WAV, MP3, FLAC, AIFF stem files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-violet-950 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!targetStemId && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Stem Track Title</span>
                <span className="text-[10px] text-violet-400">REQUIRED</span>
              </label>
              <div className="relative">
                <Music className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rhythm Guitars, Session Drums, Lead Vocals"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-violet-900/50 focus:border-violet-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Drag and Drop / File Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Select Audio Stem File
            </label>
            <div className="border-2 border-dashed border-violet-900/60 hover:border-violet-500 rounded-2xl p-5 bg-zinc-950/60 text-center transition-all">
              <input
                type="file"
                accept="audio/*"
                id="stem-file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="stem-file-upload" className="cursor-pointer block">
                <FileAudio className="w-8 h-8 text-violet-400 mx-auto mb-2 animate-pulse" />
                {selectedFile ? (
                  <span className="text-xs font-mono font-bold text-emerald-400 block truncate">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-mono font-bold text-violet-300 block mb-1">
                      Click to browse or drop stem file
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      WAV / MP3 / AAC up to 100MB
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* URL Input Option */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1">
              OR Paste External Audio Media URL
            </label>
            <input
              type="url"
              placeholder="https://... stem.mp3 or wav"
              value={fileUrlInput}
              onChange={(e) => setFileUrlInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none font-mono"
            />
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Version / Mix Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Added high-pass filter at 80Hz, re-tracked lead section..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-violet-900/50 focus:border-violet-400 rounded-xl p-3 text-xs text-white placeholder-zinc-600 outline-none font-sans"
            />
          </div>

          <div className="pt-3 border-t border-violet-900/30 flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || (!selectedFile && !fileUrlInput.trim())}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{targetStemId ? 'Upload New Version' : 'Transmit Stem'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
