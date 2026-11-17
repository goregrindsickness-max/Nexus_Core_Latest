import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, X, Search, Disc, ChevronRight, ArrowLeft } from 'lucide-react';

export interface AttachSongModalProps {
  showSongModal: boolean;
  setShowSongModal: (val: boolean) => void;
  inAppSongsList: any[];
  setAttachedSong: (song: any) => void;
  triggerNotification?: (msg: string) => void;
}

interface ReleaseGroup {
  key: string;
  album: string;
  band: string;
  coverArt: string;
  releaseYear: string;
  hasVaultAudio: boolean;
  hasPreviewOnly: boolean;
  tracks: any[];
}

interface BandGroup {
  key: string;
  band: string;
  coverArt: string;
  hasVaultAudio: boolean;
  hasPreviewOnly: boolean;
  releases: ReleaseGroup[];
  totalTracks: number;
}

export const AttachSongModal: React.FC<AttachSongModalProps> = ({
  showSongModal,
  setShowSongModal,
  inAppSongsList,
  setAttachedSong,
}) => {
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [selectedBandKey, setSelectedBandKey] = useState<string | null>(null);
  const [selectedReleaseKey, setSelectedReleaseKey] = useState<string | null>(null);

  const normalizedQuery = songSearchQuery.trim().toLowerCase();

  const bandGroups = useMemo<BandGroup[]>(() => {
    const bandMap = new Map<string, BandGroup>();

    (inAppSongsList || []).forEach((song) => {
      if (!song?.title) return;
      const bandName = String(song.band || 'Independent Artist').trim();
      const bandKey = bandName.toLowerCase();
      const albumName = String(song.album || 'Single / Release').trim();
      const releaseKey = `${bandKey}::${albumName.toLowerCase()}`;
      const isPreview = Boolean(
        song.isPreview ||
        song.audioSourceType === 'itunes_preview' ||
        /itunes\.apple\.com|audio-ssl\.itunes\.apple\.com|apple\.com/i.test(song.audioUrl || '')
      );
      const isVault = !isPreview && Boolean(song.audioUrl);

      let bandGroup = bandMap.get(bandKey);
      if (!bandGroup) {
        bandGroup = {
          key: bandKey,
          band: bandName,
          coverArt: song.coverArt || '',
          hasVaultAudio: false,
          hasPreviewOnly: false,
          releases: [],
          totalTracks: 0,
        };
        bandMap.set(bandKey, bandGroup);
      }

      if (!bandGroup.coverArt && song.coverArt) bandGroup.coverArt = song.coverArt;
      if (isVault) bandGroup.hasVaultAudio = true;
      if (isPreview) bandGroup.hasPreviewOnly = true;
      bandGroup.totalTracks += 1;

      let releaseGroup = bandGroup.releases.find((r) => r.key === releaseKey);
      if (!releaseGroup) {
        releaseGroup = {
          key: releaseKey,
          album: albumName,
          band: bandName,
          coverArt: song.coverArt || '',
          releaseYear: String(song.releaseYear || '').trim(),
          hasVaultAudio: false,
          hasPreviewOnly: false,
          tracks: [],
        };
        bandGroup.releases.push(releaseGroup);
      }

      if (!releaseGroup.coverArt && song.coverArt) releaseGroup.coverArt = song.coverArt;
      if (isVault) releaseGroup.hasVaultAudio = true;
      if (isPreview) releaseGroup.hasPreviewOnly = true;
      releaseGroup.tracks.push({ ...song, _isPreview: isPreview, _isVault: isVault });
    });

    return Array.from(bandMap.values()).sort((a, b) => {
      if (a.hasVaultAudio !== b.hasVaultAudio) return a.hasVaultAudio ? -1 : 1;
      return a.band.localeCompare(b.band);
    });
  }, [inAppSongsList]);

  const activeBand = useMemo(
    () => (selectedBandKey ? bandGroups.find((b) => b.key === selectedBandKey) || null : null),
    [bandGroups, selectedBandKey]
  );

  const activeRelease = useMemo(
    () =>
      activeBand && selectedReleaseKey
        ? activeBand.releases.find((r) => r.key === selectedReleaseKey) || null
        : null,
    [activeBand, selectedReleaseKey]
  );

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return null;

    const matchingBands = bandGroups.filter((b) =>
      b.band.toLowerCase().includes(normalizedQuery)
    );

    const matchingReleases: ReleaseGroup[] = [];
    const matchingTracks: any[] = [];

    bandGroups.forEach((b) => {
      if (activeBand && b.key !== activeBand.key) return;
      b.releases.forEach((rel) => {
        if (activeRelease && rel.key !== activeRelease.key) return;
        if (
          rel.album.toLowerCase().includes(normalizedQuery) ||
          rel.band.toLowerCase().includes(normalizedQuery)
        ) {
          matchingReleases.push(rel);
        }
        rel.tracks.forEach((tr) => {
          if (
            tr.title?.toLowerCase().includes(normalizedQuery) ||
            tr.album?.toLowerCase().includes(normalizedQuery) ||
            tr.band?.toLowerCase().includes(normalizedQuery)
          ) {
            matchingTracks.push(tr);
          }
        });
      });
    });

    return { matchingBands, matchingReleases, matchingTracks };
  }, [normalizedQuery, bandGroups, activeBand, activeRelease]);

  const handleClose = () => {
    setShowSongModal(false);
    setSongSearchQuery('');
    setSelectedBandKey(null);
    setSelectedReleaseKey(null);
  };

  const handleSelectTrack = (song: any) => {
    setAttachedSong(song);
    handleClose();
  };

  const renderTrackRow = (song: any, sIdx: number, showBandAndAlbum = false) => {
    const isPreview = Boolean(
      song._isPreview ??
      (song.isPreview ||
        song.audioSourceType === 'itunes_preview' ||
        /itunes\.apple\.com|audio-ssl\.itunes\.apple\.com|apple\.com/i.test(song.audioUrl || ''))
    );

    return (
      <div
        key={song.id ? `song-attach-${song.id}-${sIdx}` : `song-attach-${sIdx}`}
        onClick={() => handleSelectTrack(song)}
        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/50 hover:bg-emerald-950/20 border border-zinc-850 hover:border-emerald-900/30 cursor-pointer group transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center shrink-0 text-zinc-500 group-hover:text-emerald-400 font-bold text-xs overflow-hidden">
            {song.coverArt ? (
              <img src={song.coverArt} alt={song.album || song.title} className="w-full h-full object-cover" />
            ) : (
              <span>♫</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                {song.title}
              </h5>
              {isPreview ? (
                <span className="shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/40 text-amber-300">
                  30s Preview
                </span>
              ) : song.audioUrl ? (
                <span className="shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300">
                  Full Track
                </span>
              ) : null}
            </div>
            {showBandAndAlbum && (
              <p className="text-[10px] text-zinc-500 truncate font-mono uppercase tracking-wide">
                {song.band} • <span className="text-zinc-400">{song.album}</span>
              </p>
            )}
          </div>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
          {isPreview ? '0:30' : (song.duration || '3:30')}
        </span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {showSongModal && (
        <motion.div
          key="song-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#121214] border border-emerald-900/40 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 font-display">
                <Volume2 className="w-4 h-4 text-emerald-400" /> Attach Song From Scene Catalog
              </span>
              <button
                onClick={handleClose}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  placeholder={
                    activeRelease
                      ? `Search tracks in "${activeRelease.album}"...`
                      : activeBand
                        ? `Search releases or tracks by ${activeBand.band}...`
                        : 'Search by band, release, or track title...'
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors"
                  autoFocus
                />
              </div>

              {/* Breadcrumb Navigation */}
              {(activeBand || activeRelease) && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-950/70 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeRelease) {
                        setSelectedReleaseKey(null);
                      } else {
                        setSelectedBandKey(null);
                      }
                      setSongSearchQuery('');
                    }}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{activeRelease ? 'Releases' : 'All Bands'}</span>
                  </button>
                  <span className="text-zinc-600">/</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReleaseKey(null);
                      setSongSearchQuery('');
                    }}
                    className={`truncate cursor-pointer ${
                      activeRelease ? 'text-zinc-300 hover:text-white' : 'text-white font-bold'
                    }`}
                  >
                    {activeBand?.band}
                  </button>
                  {activeRelease && (
                    <>
                      <span className="text-zinc-600">/</span>
                      <span className="text-white font-bold truncate">{activeRelease.album}</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-emerald-950/25 border border-emerald-900/40 text-[11px] leading-relaxed text-zinc-300 font-mono shrink-0">
                <Disc className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  More releases will be added as official bands join our platform and upload their music.
                </span>
              </div>

              {!normalizedQuery && !activeBand && bandGroups.length > 0 && (
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1 shrink-0">
                  <span>Scene Directory ({bandGroups.length} {bandGroups.length === 1 ? 'Band' : 'Bands'})</span>
                  <span>{inAppSongsList.length} Tracks</span>
                </div>
              )}

              {/* Hierarchical / Search Results Container - Full Catalog Scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 pr-1.5 [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
                {normalizedQuery && searchResults ? (
                  searchResults.matchingBands.length === 0 &&
                  searchResults.matchingReleases.length === 0 &&
                  searchResults.matchingTracks.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-6 font-mono">No matching bands, releases, or tracks found.</p>
                  ) : (
                    <>
                      {!activeBand && searchResults.matchingBands.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1">
                            Bands ({searchResults.matchingBands.length})
                          </div>
                          {searchResults.matchingBands.map((b) => (
                            <div
                              key={`search-band-${b.key}`}
                              onClick={() => {
                                setSelectedBandKey(b.key);
                                setSelectedReleaseKey(b.releases.length === 1 ? b.releases[0].key : null);
                                setSongSearchQuery('');
                              }}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/60 hover:bg-emerald-950/20 border border-zinc-850 hover:border-emerald-900/40 cursor-pointer group transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center shrink-0 overflow-hidden text-zinc-500 text-xs">
                                  {b.coverArt ? (
                                    <img src={b.coverArt} alt={b.band} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>♫</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">{b.band}</h5>
                                    {b.hasVaultAudio && (
                                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300">
                                        Vault
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-mono text-zinc-500">
                                    {b.releases.length} {b.releases.length === 1 ? 'Release' : 'Releases'} • {b.totalTracks} {b.totalTracks === 1 ? 'Track' : 'Tracks'}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}

                      {!activeRelease && searchResults.matchingReleases.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1">
                            Releases ({searchResults.matchingReleases.length})
                          </div>
                          {searchResults.matchingReleases.map((rel) => (
                            <div
                              key={`search-rel-${rel.key}`}
                              onClick={() => {
                                setSelectedBandKey(rel.band.toLowerCase());
                                setSelectedReleaseKey(rel.key);
                                setSongSearchQuery('');
                              }}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/60 hover:bg-emerald-950/20 border border-zinc-850 hover:border-emerald-900/40 cursor-pointer group transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center shrink-0 overflow-hidden text-zinc-500 text-xs">
                                  {rel.coverArt ? (
                                    <img src={rel.coverArt} alt={rel.album} className="w-full h-full object-cover" />
                                  ) : (
                                    <Disc className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">{rel.album}</h5>
                                  <p className="text-[10px] font-mono text-zinc-500 truncate">
                                    {rel.band} • {rel.tracks.length} {rel.tracks.length === 1 ? 'Track' : 'Tracks'}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.matchingTracks.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1">
                            Tracks ({searchResults.matchingTracks.length})
                          </div>
                          {searchResults.matchingTracks.map((song, sIdx) => renderTrackRow(song, sIdx, true))}
                        </div>
                      )}
                    </>
                  )
                ) : activeRelease ? (
                  activeRelease.tracks.map((song, sIdx) => renderTrackRow(song, sIdx, false))
                ) : activeBand ? (
                  activeBand.releases.map((rel) => (
                    <div
                      key={`band-rel-${rel.key}`}
                      onClick={() => setSelectedReleaseKey(rel.key)}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/50 hover:bg-emerald-950/20 border border-zinc-850 hover:border-emerald-900/30 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center shrink-0 overflow-hidden text-zinc-500">
                          {rel.coverArt ? (
                            <img src={rel.coverArt} alt={rel.album} className="w-full h-full object-cover" />
                          ) : (
                            <Disc className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">{rel.album}</h5>
                            {rel.hasVaultAudio ? (
                              <span className="shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300">
                                Full Tracks
                              </span>
                            ) : rel.hasPreviewOnly ? (
                              <span className="shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/40 text-amber-300">
                                30s Previews
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[10px] font-mono text-zinc-500">
                            {rel.releaseYear ? `${rel.releaseYear} • ` : ''}
                            {rel.tracks.length} {rel.tracks.length === 1 ? 'Track' : 'Tracks'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                    </div>
                  ))
                ) : bandGroups.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-6 font-mono">No in-app releases available yet.</p>
                ) : (
                  bandGroups.map((b) => (
                    <div
                      key={`band-dir-${b.key}`}
                      onClick={() => {
                        setSelectedBandKey(b.key);
                        setSelectedReleaseKey(b.releases.length === 1 ? b.releases[0].key : null);
                      }}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/50 hover:bg-emerald-950/20 border border-zinc-850 hover:border-emerald-900/30 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center shrink-0 overflow-hidden text-zinc-500">
                          {b.coverArt ? (
                            <img src={b.coverArt} alt={b.band} className="w-full h-full object-cover" />
                          ) : (
                            <span>♫</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">{b.band}</h5>
                            {b.hasVaultAudio ? (
                              <span className="shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300">
                                Official Upload
                              </span>
                            ) : b.hasPreviewOnly ? (
                              <span className="shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/40 text-amber-300">
                                30s Previews
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[10px] font-mono text-zinc-500">
                            {b.releases.length} {b.releases.length === 1 ? 'Release' : 'Releases'} • {b.totalTracks} {b.totalTracks === 1 ? 'Track' : 'Tracks'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
