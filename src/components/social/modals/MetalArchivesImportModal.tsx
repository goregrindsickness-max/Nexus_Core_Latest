import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Disc, 
  Download, 
  CheckSquare, 
  Square, 
  Shield, 
  AlertCircle, 
  RefreshCw, 
  Clipboard, 
  Sparkles, 
  Music2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Tag,
  Building,
  ListMusic
} from 'lucide-react';
import { scrapeMetalArchivesBand, MetalArchivesScrapeResult, parseMetalArchivesRawText } from '../../../services/metalArchivesScraper';
import { upsertReleasesBatchToDatabase, CatalogRelease } from '../../../services/releasesService';
import { communityBandManager, DiscographyRelease } from '../../../lib/communityBands';
import { ensureUUID } from '../../../services/schemaResilienceService';

interface MetalArchivesImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandId: string;
  bandName?: string;
  onImportSuccess?: (count: number) => void;
}

export const MetalArchivesImportModal: React.FC<MetalArchivesImportModalProps> = ({
  isOpen,
  onClose,
  bandId,
  bandName = '',
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'paste'>('search');
  const [queryUrl, setQueryUrl] = useState(bandName && bandName !== 'Nexus Artist' ? bandName : '');
  const [pastedText, setPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<MetalArchivesScrapeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<Set<string>>(new Set());
  const [expandedReleaseIds, setExpandedReleaseIds] = useState<Set<string>>(new Set());
  
  // Filter checkboxes for release categories
  const [filters, setFilters] = useState<Record<string, boolean>>({
    'Full-length': true,
    'EP': true,
    'Split': true,
    'Single': true,
    'Demo': true,
    'Live': true
  });

  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleFetchScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryUrl.trim()) {
      setErrorMsg('Please enter a band name or Metal-Archives URL.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await scrapeMetalArchivesBand(queryUrl.trim());
      
      if (!result.releases || result.releases.length === 0) {
        setErrorMsg(`No archived releases found for "${queryUrl.trim()}". You can switch to the "Direct Table Paste" tab to paste the discography directly from Encyclopaedia Metallum.`);
      } else {
        setScrapeResult(result);
        // Select all matching active filters
        const initialSelected = new Set<string>();
        result.releases.forEach((rel) => {
          const type = rel.type || 'Full-length';
          if (filters[type] !== false) {
            initialSelected.add(rel.id);
          }
        });
        setSelectedReleaseIds(initialSelected);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch authentic discography. Please check band name or use Direct Table Paste.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste discography rows or table text from Metal-Archives.');
      return;
    }

    setErrorMsg(null);
    const parsed = parseMetalArchivesRawText(pastedText, queryUrl.trim() || (bandName !== 'Nexus Artist' ? bandName : 'Band'));
    
    if (parsed.releases.length === 0) {
      setErrorMsg('Could not detect release rows in pasted text. Make sure lines include release titles, types (Demo, EP, Full-length, Single), and release years.');
      return;
    }

    setScrapeResult(parsed);
    const initialSelected = new Set<string>(parsed.releases.map((r) => r.id));
    setSelectedReleaseIds(initialSelected);
  };

  const toggleFilter = (type: string) => {
    const nextFilters = { ...filters, [type]: !filters[type] };
    setFilters(nextFilters);

    if (scrapeResult) {
      const nextSelected = new Set<string>(selectedReleaseIds);
      scrapeResult.releases.forEach((rel) => {
        const rType = rel.type || 'Full-length';
        if (rType === type) {
          if (nextFilters[type]) {
            nextSelected.add(rel.id);
          } else {
            nextSelected.delete(rel.id);
          }
        }
      });
      setSelectedReleaseIds(nextSelected);
    }
  };

  const toggleSelectAll = () => {
    if (!scrapeResult) return;
    if (selectedReleaseIds.size === scrapeResult.releases.length) {
      setSelectedReleaseIds(new Set());
    } else {
      const allIds = new Set(scrapeResult.releases.map((r) => r.id));
      setSelectedReleaseIds(allIds);
    }
  };

  const toggleSelectRelease = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedReleaseIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedReleaseIds(next);
  };

  const toggleExpandRelease = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(expandedReleaseIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedReleaseIds(next);
  };

  const toggleExpandAllTracks = () => {
    if (!scrapeResult) return;
    if (expandedReleaseIds.size === scrapeResult.releases.length) {
      setExpandedReleaseIds(new Set());
    } else {
      const allIds = new Set(scrapeResult.releases.map((r) => r.id));
      setExpandedReleaseIds(allIds);
    }
  };

  const calculateTotalDuration = (tracks?: any[]) => {
    if (!tracks || tracks.length === 0) return '0:00';
    let totalSec = 0;
    for (const t of tracks) {
      if (t.duration && t.duration.includes(':')) {
        const parts = t.duration.split(':').map((p: string) => parseInt(p) || 0);
        if (parts.length === 2) {
          totalSec += parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          totalSec += parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
    }
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImportSelected = async () => {
    if (!scrapeResult || selectedReleaseIds.size === 0) return;

    setIsImporting(true);
    try {
      const releasesToImport = scrapeResult.releases.filter((r) => selectedReleaseIds.has(r.id));
      const res = await upsertReleasesBatchToDatabase(releasesToImport, bandId);

      if (res.success) {
        // Direct non-destructive merge into community band manager
        try {
          const matchedBand = communityBandManager.getById(bandId) || (bandName ? communityBandManager.findByName(bandName) : null);
          if (matchedBand) {
            const existingDiscography = matchedBand.discography || [];
            const mergedDiscography = [...existingDiscography];

            const newReleases: DiscographyRelease[] = releasesToImport.map((r, idx) => ({
              id: r.id || ensureUUID(`rel-${bandId}-${idx}-${Date.now()}`),
              title: r.title || 'Untitled Release',
              year: r.releaseDate || r.year || String(new Date().getFullYear()),
              type: (r.type?.toLowerCase() || 'album') as any,
              cover_url: r.coverUrl || r.coverImage || '',
              cover_image: r.coverUrl || r.coverImage || '',
              coverUrl: r.coverUrl || r.coverImage || '',
              coverImage: r.coverUrl || r.coverImage || '',
              image_url: r.coverUrl || r.coverImage || '',
              release_info: r.label || '',
              catalog_id: r.catalogId || '',
              label: r.label || '',
              tracks: (r.tracks || []).map((t: any, tIdx: number) => ({
                number: t.number || tIdx + 1,
                title: t.title || `Track ${tIdx + 1}`,
                duration: t.duration || '3:30',
                lyrics: t.lyrics || undefined
              }))
            }));

            for (const nr of newReleases) {
              const normTitle = nr.title.toLowerCase().trim();
              const existingIdx = mergedDiscography.findIndex(
                d => d.title.toLowerCase().trim() === normTitle || (d.id && d.id === nr.id)
              );
              if (existingIdx >= 0) {
                mergedDiscography[existingIdx] = {
                  ...mergedDiscography[existingIdx],
                  ...nr,
                  tracks: (nr.tracks && nr.tracks.length > 0) ? nr.tracks : mergedDiscography[existingIdx].tracks
                };
              } else {
                mergedDiscography.push(nr);
              }
            }

            communityBandManager.upsertCommunityBand({
              ...matchedBand,
              discography: mergedDiscography
            });
          }
        } catch (commErr) {
          console.warn('[MetalArchivesImportModal] communityBandManager update notice:', commErr);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('nexus_core_toast', {
              detail: {
                message: `Successfully imported ${releasesToImport.length} real releases into your catalog!`,
                type: 'success'
              }
            })
          );
        }
        if (onImportSuccess) {
          onImportSuccess(releasesToImport.length);
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to upsert releases to database.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Critical error during batch import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div id="metal_archives_modal_backdrop" className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        id="metal_archives_modal_dialog"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div id="metal_archives_modal_header" className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <span>Metal-Archives & Music Catalog Importer</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
                  Authentic Live Sync
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Auto-extracts song titles, track durations, record labels, catalog numbers, and official artwork
              </p>
            </div>
          </div>
          <button
            id="close_metal_archives_modal_btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div id="metal_archives_tabs" className="flex border-b border-zinc-800 bg-zinc-950/40 px-6 pt-3">
          <button
            id="tab_search_url_btn"
            onClick={() => setActiveTab('search')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & Archive URL</span>
          </button>
          <button
            id="tab_direct_paste_btn"
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Direct Metal-Archives Table Paste</span>
          </button>
        </div>

        {/* Content Body */}
        <div id="metal_archives_modal_body" className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'search' ? (
            /* Search/URL Form */
            <form id="metal_archives_search_form" onSubmit={handleFetchScrape} className="space-y-4">
              <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Band Name or Encyclopaedia Metallum URL
              </label>
              <div className="space-y-3">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="search_query_url_input"
                    type="text"
                    value={queryUrl}
                    onChange={(e) => setQueryUrl(e.target.value)}
                    placeholder="e.g., Sanguisugabogg, https://www.metal-archives.com/bands/Sanguisugabogg/3540450514, or Necrophagist"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
                  />
                </div>
                <button
                  id="fetch_scrape_submit_btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/25 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Resolving Authentic Discography, Tracks & Labels...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Fetch Live Discography & Tracklists</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Direct Paste Area */
            <div id="metal_archives_paste_section" className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  Paste Encyclopaedia Metallum Table or Tracklist Rows
                </label>
                <a
                  href="https://www.metal-archives.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-red-400 hover:underline flex items-center gap-1"
                >
                  <span>Open metal-archives.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <textarea
                id="metal_archives_raw_textarea"
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Example rows:\nTortured Whole Full-length 2021 Century Media / 19439832132\n1. Menstrual Envy 03:09\n2. Gored in the Chest 02:59\n3. Dragged by a Truck 02:32\nPornographic Seizures EP 2019 Maggot Stomp / MAG37\n1. Uningest 01:38\n2. Turkish Blood Orgy 01:29`}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
              />
              <button
                id="parse_pasted_text_btn"
                type="button"
                onClick={handleParsePastedText}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Clipboard className="w-4 h-4" />
                <span>Parse Discography & Tracklists</span>
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div id="metal_archives_error_banner" className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Staged Preview Section */}
          {scrapeResult && scrapeResult.releases.length > 0 && (
            <div id="staged_preview_container" className="space-y-5 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-100">{scrapeResult.bandName}</h3>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md text-xs font-medium">
                      {scrapeResult.country}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{scrapeResult.genre}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Live Catalog</p>
                    <p className="text-sm font-bold text-zinc-200">{scrapeResult.releases.length} real releases</p>
                  </div>
                  <div className="h-8 w-px bg-zinc-800" />
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Selected for Import</p>
                    <p className="text-sm font-bold text-red-400">{selectedReleaseIds.size} ready</p>
                  </div>
                </div>
              </div>

              {/* Filter Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filter by Release Type</span>
                  <button
                    id="toggle_all_tracks_preview_btn"
                    type="button"
                    onClick={toggleExpandAllTracks}
                    className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{expandedReleaseIds.size === scrapeResult.releases.length ? 'Collapse Tracklists' : 'Expand All Tracklists'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(filters).map((type, typeIdx) => (
                    <button
                      key={`filter-type-${type}-${typeIdx}`}
                      type="button"
                      onClick={() => toggleFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-2 cursor-pointer ${
                        filters[type]
                          ? 'bg-red-600/10 border-red-500/30 text-red-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${filters[type] ? 'bg-red-500' : 'bg-zinc-700'}`} />
                      {type}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Release List / Table */}
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 text-xs font-semibold text-zinc-400">
                  <div className="flex items-center gap-3">
                    <button
                      id="toggle_select_all_btn"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {selectedReleaseIds.size === scrapeResult.releases.length ? (
                        <CheckSquare className="w-4 h-4 text-red-500" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-500" />
                      )}
                      <span>Toggle All ({scrapeResult.releases.length})</span>
                    </button>
                  </div>
                  <span>Metadata & Track Details</span>
                </div>

                <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto">
                  {scrapeResult.releases.map((rel, relIdx) => {
                    const isSelected = selectedReleaseIds.has(rel.id);
                    const isExpanded = expandedReleaseIds.has(rel.id);
                    const trackCount = rel.tracks?.length || 0;
                    const totalRuntime = calculateTotalDuration(rel.tracks);

                    return (
                      <div
                        key={rel.id ? `rel-${rel.id}-${relIdx}` : `rel-${relIdx}`}
                        className={`transition-colors ${isSelected ? 'bg-red-950/10' : ''}`}
                      >
                        {/* Main Release Header Row */}
                        <div
                          onClick={() => toggleSelectRelease(rel.id)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-4">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectRelease(rel.id, e)}
                              className="text-zinc-400 shrink-0 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-red-500" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-600" />
                              )}
                            </button>
                            
                            {/* Artwork or Icon */}
                            <div className="w-10 h-10 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                              {(rel.cover_url || rel.cover_image || rel.coverUrl || rel.coverImage || rel.image_url) ? (
                                <img
                                  src={rel.cover_url || rel.cover_image || rel.coverUrl || rel.coverImage || rel.image_url}
                                  alt={rel.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Music2 className="w-4 h-4 text-zinc-500" />
                              )}
                            </div>

                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-zinc-100 truncate">{rel.title}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                                {/* Record Label Badge */}
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[11px] font-medium">
                                  <Building className="w-2.5 h-2.5 text-zinc-400" />
                                  {rel.label || 'Underground Label'}
                                </span>
                                
                                {/* Catalog ID Badge */}
                                {rel.catalogId && rel.catalogId !== 'N/A' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400 text-[11px] font-mono">
                                    <Tag className="w-2.5 h-2.5 text-zinc-500" />
                                    {rel.catalogId}
                                  </span>
                                )}

                                <span>&middot;</span>
                                <span className="text-zinc-500">{trackCount} {trackCount === 1 ? 'track' : 'tracks'} ({totalRuntime})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              rel.type === 'Full-length'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : rel.type === 'EP'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : rel.type === 'Demo'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : rel.type === 'Live'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              {rel.type}
                            </span>
                            <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                              {rel.release_date || rel.releaseDate}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleExpandRelease(rel.id, e)}
                              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                              title={isExpanded ? 'Hide Tracklist' : 'View Tracklist'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Tracklist Details */}
                        <AnimatePresence>
                          {isExpanded && rel.tracks && rel.tracks.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-12 py-3 bg-zinc-950/80 border-t border-zinc-800/60"
                            >
                              <div className="flex items-center justify-between mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                                <span>Tracklist ({trackCount} Songs)</span>
                                <span>Duration ({totalRuntime})</span>
                              </div>
                              <div className="space-y-1.5">
                                {rel.tracks.map((t: any, tIdx: number) => (
                                  <div
                                    key={t.id ? `ma-trk-${t.id}-${tIdx}` : `ma-trk-${tIdx}`}
                                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/40 text-zinc-300"
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <span className="w-5 font-mono text-zinc-500 text-[11px] text-right shrink-0">
                                        {t.num || tIdx + 1}.
                                      </span>
                                      <span className="truncate font-medium text-zinc-200">{t.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px] shrink-0 ml-3">
                                      <Clock className="w-2.5 h-2.5 text-zinc-500" />
                                      <span>{t.duration || '3:30'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div id="metal_archives_modal_footer" className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
          <button
            id="metal_archives_cancel_btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="metal_archives_import_confirm_btn"
            type="button"
            disabled={!scrapeResult || selectedReleaseIds.size === 0 || isImporting}
            onClick={handleImportSelected}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importing to Catalog...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  Import {selectedReleaseIds.size} {selectedReleaseIds.size === 1 ? 'Release' : 'Releases'} with Full Metadata
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
