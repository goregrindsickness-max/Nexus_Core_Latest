import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Radio, Play, Send } from 'lucide-react';
import { getSupabase } from '../../../supabase';
import { UserProfile } from '../../../types';

interface PTTRadioModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  triggerNotification: (msg: string) => void;
  activeBandId?: string;
  playPttSound: (type: 'beep-on' | 'beep-off' | 'static') => void;
}

export const PTTRadioModal: React.FC<PTTRadioModalProps> = ({ isOpen, onClose, userProfile, triggerNotification, activeBandId = 'global', playPttSound }) => {
  const [isPttRecording, setIsPttRecording] = useState(false);
  const [pttText, setPttText] = useState('');
  const [pttLogs, setPttLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_ptt_logs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const channelRef = useRef<any>(null);
  const audioPlaybackCache = useRef<Record<string, string>>({});

  useEffect(() => {
    if (pttLogs.length > 0) {
      localStorage.setItem('nexus_ptt_logs_v1', JSON.stringify(pttLogs));
    }
  }, [pttLogs]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Create a realtime channel scoped to the active band
    const channel = supabase.channel(`ptt-radio`);

    channel.on('broadcast', { event: 'ptt_transmission' }, (payload) => {
      const log = payload.payload;
      
      // Cache the audio data
      if (log.audioData) {
        audioPlaybackCache.current[log.id] = log.audioData;
      }
      
      setPttLogs(prev => {
        // Prevent duplicates
        if ((prev || []).some(p => p.id === log.id)) return prev;
        return [log, ...prev].slice(0, 50); // Keep last 50
      });
      
      // If the log is from someone else, automatically play the audio like a real walkie talkie
      if (log.sender !== userProfile?.name) {
        if (log.audioData) {
          const audio = new Audio(log.audioData);
          playPttSound('static');
          audio.play().catch(e => console.warn('Autoplay prevented:', e));
        } else {
          triggerNotification(`${log.sender}: ${log.text}`);
        }
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to PTT Channel');
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [activeBandId, userProfile?.name, playPttSound, triggerNotification]);

  const startRecording = async () => {
    setIsPttRecording(true);
    playPttSound('beep-on');
    triggerNotification('🔴 PTT Transmission Open. Speak now.');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          
          const newLog = {
            id: 'ptt-' + Date.now(),
            sender: userProfile?.name || 'Crew Member',
            role: userProfile?.role || 'Crew',
            text: 'Live Voice Transmission',
            timestamp: new Date().toISOString(),
            type: 'voice',
            duration: Math.max(1, Math.round(audioBlob.size / 10000)), // rough estimate
            avatar_url: userProfile?.avatar_url || '',
            audioData: base64Audio
          };
          
          setPttLogs(prev => [newLog, ...prev].slice(0, 50));
          triggerNotification('✓ Transmission sent to band channel.');
          
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'ptt_transmission',
              payload: newLog
            }).catch((err: any) => console.error('Failed to broadcast:', err));
          }
        };

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
    } catch (err) {
      console.error('Mic access denied', err);
      triggerNotification('Microphone access denied. Check permissions.');
      setIsPttRecording(false);
      playPttSound('beep-off');
    }
  };

  const stopRecording = () => {
    if (isPttRecording) {
      setIsPttRecording(false);
      playPttSound('beep-off');
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  
  const sendText = () => {
    if (!pttText.trim()) return;
    
    const newLog = {
      id: 'ptt-' + Date.now(),
      sender: userProfile?.name || 'Crew Member',
      role: userProfile?.role || 'Crew',
      text: pttText.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      avatar_url: userProfile?.avatar_url || '',
    };
    
    setPttLogs(prev => [newLog, ...prev].slice(0, 50));
    setPttText('');
    triggerNotification('✓ Text transmission broadcasted.');
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'ptt_transmission',
        payload: newLog
      }).catch((err: any) => console.error('Failed to broadcast:', err));
    }
  };

  const playLogAudio = (log: any) => {
    playPttSound('static');
    const cachedData = audioPlaybackCache.current[log.id] || log.audioData;
    if (cachedData) {
      const audio = new Audio(cachedData);
      audio.play().catch(e => triggerNotification('Audio playback failed.'));
    } else {
       triggerNotification(`Playing transmission from ${log.sender}...`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-[3px] cursor-pointer"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="relative w-full max-w-sm bg-[#0a0c10] border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl z-50 overflow-hidden text-left"
          >
            <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            <div className="absolute -top-12 left-10 w-2.5 h-12 bg-zinc-850 rounded-t-lg border-t-4 border-zinc-700" />

            <div className="flex justify-between items-center pb-3 border-b border-zinc-900 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse" />
                <div>
                  <h3 className="font-display font-black text-xs text-white uppercase tracking-widest flex items-center gap-1.5">
                    Nexus PTT Radio
                  </h3>
                  <p className="text-[8.5px] font-mono text-[#00ffcc] uppercase tracking-wider">
                    Band Channel [ 446.1 MHz ]
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  stopRecording();
                  onClose();
                }}
                className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
                title="Close Radio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-12 gap-1 px-3 py-1 bg-zinc-950/60 rounded-xl border border-zinc-900/60 opacity-60 mb-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={`ptt-bar-${i}`} className="h-1.5 bg-zinc-800 rounded-full" />
              ))}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                  Live Channel Transmissions
                </span>
                <button 
                  onClick={() => {
                    setPttLogs([]);
                    localStorage.setItem('nexus_ptt_logs_v1', JSON.stringify([]));
                    audioPlaybackCache.current = {};
                  }}
                  className="text-[8.5px] font-mono text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear Feed
                </button>
              </div>

              <div className="h-44 overflow-y-auto space-y-2.5 bg-zinc-950/75 p-3 rounded-2xl border border-zinc-900 scrollbar-thin pr-1 text-xs">
                {pttLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-1.5 text-zinc-600">
                    <Radio className="w-6 h-6 stroke-[1.5] text-zinc-700 animate-pulse" />
                    <span className="font-mono text-[9px] uppercase tracking-wider">Channel Static. No transmissions.</span>
                  </div>
                ) : (
                  pttLogs.map((log, idx) => (
                    <div key={`${log.id}-${idx}`} className="space-y-1 bg-zinc-900/35 border border-zinc-900 p-2.5 rounded-xl text-[11px] leading-relaxed relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {log.avatar_url ? (
                            <img src={log.avatar_url} className="w-4 h-4 rounded-full object-cover border border-zinc-800 shrink-0" alt="" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-mono text-[8px] font-black uppercase text-zinc-300">
                              {log.sender ? log.sender[0] : '?'}
                            </div>
                          )}
                          <span className="font-sans font-bold text-zinc-200 truncate">{log.sender}</span>
                          <span className="text-[8px] font-mono text-zinc-500">({log.role})</span>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      {log.type === 'voice' ? (
                        <div className="flex items-center justify-between bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/35 p-1.5 rounded-lg transition-all">
                          <div className="flex items-center gap-2 min-w-0">
                            <button 
                              onClick={() => playLogAudio(log)}
                              className="w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shrink-0 active:scale-90 transition-all cursor-pointer"
                              title="Play Audio Note"
                            >
                              <Play className="w-2.5 h-2.5 fill-black" />
                            </button>
                            <div className="text-left leading-tight min-w-0">
                              <span className="font-mono text-[9px] text-amber-400 font-bold block leading-none">
                                Voice Transmission • {log.duration}s
                              </span>
                              <span className="text-[9.5px] text-zinc-400 italic truncate block">
                                "{log.text}"
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-end gap-0.5 h-3.5 shrink-0 opacity-55 pl-1.5">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div 
                                key={`ptt-channel-${i}`} 
                                className="w-[2.5px] bg-amber-400 rounded-full" 
                                style={{ height: `${20 + Math.random() * 80}%` }} 
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pl-1.5 border-l-2 border-zinc-700 text-zinc-300">
                          {log.text}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#101216] border border-zinc-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden mb-3.5">
              {isPttRecording && (
                <div className="absolute inset-0 bg-red-950/20 animate-pulse pointer-events-none" />
              )}

              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startRecording();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopRecording();
                }}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-xl select-none cursor-pointer border-4 ${
                  isPttRecording 
                    ? 'bg-red-500 border-zinc-900 text-white scale-95 shadow-red-500/20 ring-4 ring-red-500/20' 
                    : 'bg-amber-500 hover:bg-amber-400 border-zinc-900 text-black active:scale-95 shadow-amber-500/20 hover:shadow-amber-500/30'
                }`}
              >
                <Mic className={`w-8 h-8 ${isPttRecording ? 'animate-pulse' : ''}`} />
              </button>
              <div className="mt-3 space-y-0.5">
                <span className="block text-[10px] font-mono text-zinc-400 font-bold tracking-widest uppercase">
                  {isPttRecording ? 'Transmitting...' : 'Push to Talk'}
                </span>
                <span className="block text-[8px] font-mono text-zinc-600">
                  Global Walkie-Talkie
                </span>
              </div>
            </div>

            {/* Text Fallback Row */}
            <div className="relative">
              <input
                type="text"
                value={pttText}
                onChange={(e) => setPttText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pttText.trim()) {
                    sendText();
                  }
                }}
                placeholder="Type fallback text backstage..."
                className="w-full bg-zinc-950 border border-zinc-900 focus:border-amber-500/60 focus:outline-none rounded-xl py-2.5 pl-3 pr-10 text-[11px] text-zinc-100 placeholder-zinc-500 font-sans"
              />
              <button
                onClick={() => {
                  if (pttText.trim()) sendText();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#00ffcc] hover:text-white transition-colors cursor-pointer"
                title="Send Text Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
