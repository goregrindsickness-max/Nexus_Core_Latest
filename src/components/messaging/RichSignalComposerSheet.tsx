import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Disc3, Mic, Music, Send, Square, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  AudioCardPayload,
  OfferCardPayload,
  createClientMsgId,
  deriveAudioPeaks,
} from '../../utils/groupMessagingUtils';

export type SignalComposerMode = 'demo' | 'voice' | 'offer' | 'show';

interface RichSignalComposerSheetProps {
  mode: SignalComposerMode | null;
  onClose: () => void;
  defaultArtistName?: string;
  onSubmitAudioCard: (card: AudioCardPayload, captionText?: string) => void;
  onSubmitOfferCard: (card: OfferCardPayload, captionText?: string) => void;
}

export const RichSignalComposerSheet: React.FC<RichSignalComposerSheetProps> = ({
  mode,
  onClose,
  defaultArtistName = 'Band Demo',
  onSubmitAudioCard,
  onSubmitOfferCard,
}) => {
  // Song Demo state
  const [trackTitle, setTrackTitle] = useState('Unreleased Master Track');
  const [artistName, setArtistName] = useState(defaultArtistName);
  const [audioUrl, setAudioUrl] = useState('');
  const [demoDurationSec, setDemoDurationSec] = useState(168);
  const [demoNote, setDemoNote] = useState('');

  // Voice Note state
  const [isRecording, setIsRecording] = useState(false);
  const [recordElapsedSec, setRecordElapsedSec] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Tour Offer & Show Share state
  const [upcomingShows, setUpcomingShows] = useState<any[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [offerTitle, setOfferTitle] = useState('Regional Tour Routing Slot');
  const [offerVenue, setOfferVenue] = useState('');
  const [offerCity, setOfferCity] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [offerGuarantee, setOfferGuarantee] = useState('$1,000 Guarantee + Door Split');
  const [offerTerms, setOfferTerms] = useState('Backline provided · 8:00 PM load-in');

  useEffect(() => {
    setArtistName(defaultArtistName);
  }, [defaultArtistName]);

  // Fetch upcoming shows for Tour Offer / Share Show picker
  useEffect(() => {
    if (mode !== 'offer' && mode !== 'show') return;
    let cancelled = false;
    const loadShows = async () => {
      try {
        const { data } = await supabase
          .from('shows')
          .select('id, headliner, name, venue_name, venue, city, show_date, date, ticket_price')
          .order('show_date', { ascending: true })
          .limit(25);
        if (!cancelled && Array.isArray(data)) {
          const clean = data.filter((s: any) => !s.is_embargoed && !s.is_draft);
          setUpcomingShows(clean);
        }
      } catch {
        // non-blocking
      }
    };
    loadShows();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Cleanup recorder on close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (!mode) return null;

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    setRecordError(null);
    setRecordedAudioUrl(null);
    setRecordElapsedSec(0);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setRecordError('Microphone recording is unavailable in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordElapsedSec((s) => {
          if (s >= 59) {
            stopRecording();
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setRecordError('Microphone permission denied or unavailable.');
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!trackTitle || trackTitle === 'Unreleased Master Track') {
      setTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAudioUrl(dataUrl);
      const probe = new Audio(dataUrl);
      probe.addEventListener('loadedmetadata', () => {
        if (probe.duration && isFinite(probe.duration)) {
          setDemoDurationSec(Math.max(1, Math.round(probe.duration)));
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectShow = (showId: string) => {
    setSelectedShowId(showId);
    const found = upcomingShows.find((s) => String(s.id) === String(showId));
    if (!found) return;
    setOfferTitle(found.headliner || found.name || 'Live Show');
    setOfferVenue(found.venue_name || found.venue || '');
    setOfferCity(found.city || '');
    setOfferDate(found.show_date || found.date || '');
  };

  const handleSendDemo = () => {
    const id = createClientMsgId();
    const cleanTitle = trackTitle.trim() || 'Unreleased Master Demo';
    onSubmitAudioCard(
      {
        id,
        kind: 'demo',
        title: cleanTitle,
        artist: artistName.trim() || 'Band Demo',
        durationSec: demoDurationSec,
        audioUrl: audioUrl.trim() || undefined,
        peaks: deriveAudioPeaks(cleanTitle, 36),
      },
      demoNote.trim()
    );
    onClose();
  };

  const handleSendVoiceNote = () => {
    if (!recordedAudioUrl) return;
    const id = createClientMsgId();
    onSubmitAudioCard(
      {
        id,
        kind: 'voice',
        title: 'Voice Note',
        artist: artistName.trim() || 'Member',
        durationSec: Math.max(1, recordElapsedSec),
        audioUrl: recordedAudioUrl,
        peaks: deriveAudioPeaks(`${id}_${recordElapsedSec}`, 36),
      },
      ''
    );
    onClose();
  };

  const handleSendOfferOrShow = () => {
    const id = createClientMsgId();
    const isShowShare = mode === 'show';
    onSubmitOfferCard(
      {
        id,
        type: isShowShare ? 'show_share' : 'tour_offer',
        title: offerTitle.trim() || (isShowShare ? 'Upcoming Show' : 'Tour Booking Offer'),
        venue: offerVenue.trim() || undefined,
        city: offerCity.trim() || undefined,
        date: offerDate.trim() || undefined,
        guarantee: isShowShare ? undefined : offerGuarantee.trim() || undefined,
        terms: offerTerms.trim() || undefined,
        showId: selectedShowId || undefined,
        status: isShowShare ? undefined : 'pending',
      },
      ''
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[290] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => {
        if (isRecording) stopRecording();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-[#0c0e13] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3.5 border-b border-white/[0.07] bg-[#090b0f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'demo' && <Music className="w-4 h-4 text-rose-400" />}
            {mode === 'voice' && <Mic className="w-4 h-4 text-rose-400" />}
            {mode === 'offer' && <Calendar className="w-4 h-4 text-rose-400" />}
            {mode === 'show' && <Disc3 className="w-4 h-4 text-rose-400" />}
            <h3 className="text-sm font-bold tracking-tight">
              {mode === 'demo'
                ? 'Send Song Demo Card'
                : mode === 'voice'
                ? 'Record Voice Note'
                : mode === 'offer'
                ? 'Send Tour Booking Offer'
                : 'Share Show Card'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="w-10 h-10 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="Close signal composer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {mode === 'demo' && (
            <>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Track Title
                </label>
                <input
                  type="text"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="Track title..."
                  className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Band / Artist Name
                </label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Artist or band..."
                  className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Audio File or Stream URL (optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={audioUrl.startsWith('data:') ? 'Audio file attached' : audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://...mp3 or upload file"
                    className="flex-1 bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                  />
                  <input
                    ref={audioFileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => audioFileInputRef.current?.click()}
                    className="px-3 min-h-[40px] rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Message Note (optional)
                </label>
                <input
                  type="text"
                  value={demoNote}
                  onChange={(e) => setDemoNote(e.target.value)}
                  placeholder="Mix v2 — let us know thoughts on drums..."
                  className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <button
                type="button"
                onClick={handleSendDemo}
                className="w-full min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Waveform Demo Card</span>
              </button>
            </>
          )}

          {mode === 'voice' && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
                  isRecording
                    ? 'bg-rose-600/20 border-rose-500 text-rose-400 scene-note-flash-ring'
                    : recordedAudioUrl
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400'
                    : 'bg-white/[0.05] border-white/[0.12] text-zinc-300'
                }`}
              >
                <Mic className="w-8 h-8" />
              </div>

              <p className="text-lg font-bold tabular-nums text-white">
                0:{String(recordElapsedSec).padStart(2, '0')}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">/ 1:00</span>
              </p>

              {recordError && (
                <p className="text-xs text-rose-400 text-center">{recordError}</p>
              )}

              <div className="w-full flex items-center gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex-1 min-h-[44px] rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-rose-400" />
                    <span>{recordedAudioUrl ? 'Re-record' : 'Start Recording'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {recordedAudioUrl && !isRecording && (
                  <button
                    type="button"
                    onClick={handleSendVoiceNote}
                    className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Voice Note</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {(mode === 'offer' || mode === 'show') && (
            <>
              {upcomingShows.length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    Quick-fill from Upcoming Shows
                  </label>
                  <select
                    value={selectedShowId}
                    onChange={(e) => handleSelectShow(e.target.value)}
                    className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                  >
                    <option value="">Select a show (optional)...</option>
                    {upcomingShows.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.headliner || s.name} — {s.venue_name || s.venue} ({s.show_date || s.date || 'TBA'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  {mode === 'show' ? 'Headliner / Event Title' : 'Tour / Booking Title'}
                </label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={offerVenue}
                    onChange={(e) => setOfferVenue(e.target.value)}
                    placeholder="e.g. The Bottleneck"
                    className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/60"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    value={offerCity}
                    onChange={(e) => setOfferCity(e.target.value)}
                    placeholder="e.g. Lawrence, KS"
                    className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/60"
                  />
                </div>
              </div>

              <div className={mode === 'offer' ? 'grid grid-cols-2 gap-2' : ''}>
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={offerDate}
                    onChange={(e) => setOfferDate(e.target.value)}
                    placeholder="e.g. Nov 28, 2026"
                    className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/60"
                  />
                </div>
                {mode === 'offer' && (
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Guarantee / Deal
                    </label>
                    <input
                      type="text"
                      value={offerGuarantee}
                      onChange={(e) => setOfferGuarantee(e.target.value)}
                      placeholder="$1,000 + Door"
                      className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/60"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Terms / Show Notes
                </label>
                <input
                  type="text"
                  value={offerTerms}
                  onChange={(e) => setOfferTerms(e.target.value)}
                  placeholder="Load-in time, backline, door split..."
                  className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <button
                type="button"
                onClick={handleSendOfferOrShow}
                className="w-full min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{mode === 'show' ? 'Share Show Card' : 'Send Tour Offer Card'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichSignalComposerSheet;
