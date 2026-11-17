import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Disc,
  Download,
  CheckSquare,
  Square,
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
  ListMusic,
  Camera,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  scrapeMetalArchivesBand,
  MetalArchivesScrapeResult,
  parseDiscographyFromImageOrText,
} from '../../../services/metalArchivesScraper';
import { upsertReleasesBatchToDatabase, CatalogRelease } from '../../../services/releasesService';
import {
  communityBandManager,
  DiscographyRelease,
  resolveAuthenticReleaseYear,
  findMasterReleaseCover,
  deduplicateDiscography,
} from '../../../lib/communityBands';
import { ensureUUID } from '../../../services/schemaResilienceService';

interface MetalArchivesImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandId: string;
  bandName?: string;
  onImportSuccess?: (count: number, importedReleases?: DiscographyRelease[]) => void;
}

export const MetalArchivesImportModal: React.FC<MetalArchivesImportModalProps> = ({
  isOpen,
  onClose,
  bandId,
  bandName = '',
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'paste'>('search');
  const [selectedSource, setSelectedSource] = useState<'all' | 'google' | 'itunes' | 'metal-archives'>('all');
  const [queryUrl, setQueryUrl] = useState(bandName && bandName !== 'Nexus Artist' ? bandName : '');

  useEffect(() => {
    if (bandName && bandName !== 'Nexus Artist') {
      setQueryUrl(bandName);
    }
  }, [bandName]);

  const [pastedText, setPastedText] = useState('');
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const [pasteAlbumTitle, setPasteAlbumTitle] = useState('');
  const [pasteAlbumYear, setPasteAlbumYear] = useState('');
  const [pasteAlbumType, setPasteAlbumType] = useState('Full-length');
  const [pasteAlbumLabel, setPasteAlbumLabel] = useState('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<MetalArchivesScrapeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<Set<string>>(new Set());
  const [expandedReleaseIds, setExpandedReleaseIds] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<Record<string, boolean>>({
    'Full-length': true,
    EP: true,
    Split: true,
    Single: true,
    Demo: true,
    Live: true,
  });

  const [isImporting, setIsImporting] = useState(false);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageFilesAdded = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArr.length === 0) return;

    setErrorMsg(null);
    const loadedUrls: string[] = [];
    for (const f of fileArr.slice(0, 5)) {
      try {
        const dataUrl = await readFileAsDataUrl(f);
        if (dataUrl) loadedUrls.push(dataUrl);
      } catch (_) {}
    }
    if (loadedUrls.length > 0) {
      setPastedImages((prev) => [...prev, ...loadedUrls].slice(0, 5));
      if (activeTab !== 'paste') setActiveTab('paste');
    }
  };

  // Global & modal-level clipboard paste handler for screenshots
  const handleClipboardPasteEvent = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await handleImageFilesAdded(imageFiles);
    }
  };

  const handleReadClipboardButton = async () => {
    setErrorMsg(null);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
        const clipboardItems = await navigator.clipboard.read();
        const files: File[] = [];
        for (const item of clipboardItems) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            files.push(new File([blob], `clipboard-${Date.now()}.png`, { type: imgType }));
          }
        }
        if (files.length > 0) {
          await handleImageFilesAdded(files);
          return;
        }
      }
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const txt = await navigator.clipboard.readText();
        if (txt && txt.trim()) {
          setPastedText((prev) => (prev ? `${prev}\n${txt}` : txt));
          return;
        }
      }
      setErrorMsg('No screenshot found on clipboard. Press Ctrl+V / Cmd+V or tap "Upload Screenshot" to select an image.');
    } catch {
      setErrorMsg('Clipboard permission blocked by browser. Press Ctrl+V / Cmd+V directly or tap "Upload Screenshot" to choose your screenshot.');
    }
  };

  if (!isOpen) return null;

  const handleFetchScrape = async (
    e?: React.FormEvent,
    overrideSource?: 'all' | 'google' | 'itunes' | 'metal-archives'
  ) => {
    if (e) e.preventDefault();
    if (!queryUrl.trim()) {
      setErrorMsg('Please enter a band name or search query.');
      return;
    }

    const src = overrideSource || selectedSource;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await scrapeMetalArchivesBand(queryUrl.trim(), undefined, src);

      if (!result.releases || result.releases.length === 0) {
        setErrorMsg(
          `No releases found for "${queryUrl.trim()}" on ${
            src === 'google'
              ? 'Google & Web'
              : src === 'itunes'
              ? 'Apple Music'
              : src === 'metal-archives'
              ? 'Metal-Archives / MusicBrainz'
              : 'all sources'
          }. Try switching to the "Screenshot / Image Paste" tab to scan a screenshot!`
        );
      } else {
        setScrapeResult(result);
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
      setErrorMsg(
        err?.message ||
          'Failed to fetch authentic discography. Please check band name or use Screenshot / Image Paste.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseScreenshotOrText = async () => {
    if (pastedImages.length === 0 && !pastedText.trim()) {
      setErrorMsg('Please paste or upload at least one screenshot image (or paste tracklist text).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resolvedBand =
        queryUrl.trim() || (bandName && bandName !== 'Nexus Artist' ? bandName : 'Band');
      const parsed = await parseDiscographyFromImageOrText({
        images: pastedImages,
        rawText: pastedText,
        bandName: resolvedBand,
        defaultAlbumTitle: pasteAlbumTitle.trim() || undefined,
        defaultYear: pasteAlbumYear.trim() || undefined,
        defaultType: pasteAlbumType,
        defaultLabel: pasteAlbumLabel.trim() || undefined,
      });

      if (!parsed.releases || parsed.releases.length === 0) {
        setErrorMsg(
          'Could not detect tracks or album info. Make sure the screenshot clearly shows the tracklist or album details.'
        );
        return;
      }

      setScrapeResult(parsed);
      const allIds = new Set<string>(parsed.releases.map((r) => r.id));
      setSelectedReleaseIds(allIds);
      setExpandedReleaseIds(allIds);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse screenshot. Please try another crop or add an Album Title hint.');
    } finally {
      setIsLoading(false);
    }
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
        const newReleases: DiscographyRelease[] = releasesToImport.map((r: any, idx: number) => {
          const cUrl =
            r.coverUrl ||
            r.coverImage ||
            r.cover_url ||
            r.cover_image ||
            r.image_url ||
            r.imageUrl ||
            r.artwork ||
            r.image ||
            findMasterReleaseCover(r.title, bandName || bandId) ||
            '';
          return {
            id: r.id || ensureUUID(`rel-${bandId}-${idx}-${Date.now()}`),
            title: r.title || 'Untitled Release',
            year: resolveAuthenticReleaseYear(r) || String(new Date().getFullYear()),
            type: (r.type?.toLowerCase() || 'album') as any,
            cover_url: cUrl,
            cover_image: cUrl,
            coverUrl: cUrl,
            coverImage: cUrl,
            image_url: cUrl,
            image: cUrl,
            artwork: cUrl,
            release_info: r.label || '',
            catalog_id: r.catalogId || '',
            label: r.label || '',
            tracks: (r.tracks || []).map((t: any, tIdx: number) => ({
              number: typeof t.number === 'number' ? t.number : parseInt(t.num) || tIdx + 1,
              title: t.title || `Track ${tIdx + 1}`,
              duration: t.duration || '3:30',
              lyrics: t.lyrics || undefined,
              previewUrl: t.previewUrl || t.preview_url || undefined,
            })),
          };
        });

        try {
          const matchedBand =
            communityBandManager.getById(bandId) ||
            (bandName ? communityBandManager.findByName(bandName) : null);
          if (matchedBand) {
            const existingDiscography = matchedBand.discography || [];
            const mergedDiscography = [...existingDiscography];

            for (const nr of newReleases) {
              const normTitle = nr.title.toLowerCase().trim();
              const existingIdx = mergedDiscography.findIndex(
                (d) => d.title.toLowerCase().trim() === normTitle || (d.id && d.id === nr.id)
              );
              if (existingIdx >= 0) {
                mergedDiscography[existingIdx] = {
                  ...mergedDiscography[existingIdx],
                  ...nr,
                  tracks:
                    nr.tracks &&
                    nr.tracks.length > 0 &&
                    nr.tracks.length >= (mergedDiscography[existingIdx].tracks?.length || 0)
                      ? nr.tracks
                      : mergedDiscography[existingIdx].tracks,
                };
              } else {
                mergedDiscography.push(nr);
              }
            }

            const deduplicatedFinal = deduplicateDiscography(
              mergedDiscography,
              bandName || bandId
            );

            communityBandManager.upsertCommunityBand({
              ...matchedBand,
              discography: deduplicatedFinal,
            });
          }
        } catch (commErr) {
          console.warn('[MetalArchivesImportModal] communityBandManager update notice:', commErr);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('nexus_discography_imported', {
              detail: {
                bandId,
                bandName,
                releases: releasesToImport,
                discographyReleases: newReleases,
              },
            })
          );
          window.dispatchEvent(
            new CustomEvent('nexus_core_toast', {
              detail: {
                message: `Successfully imported ${releasesToImport.length} real releases into your catalog!`,
                type: 'success',
              },
            })
          );
        }
        if (onImportSuccess) {
          onImportSuccess(releasesToImport.length, newReleases);
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
    <div
      id="metal_archives_modal_backdrop"
      onPaste={handleClipboardPasteEvent}
      className="fixed inset-0 z-[2000050] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <motion.div
        id="metal_archives_modal_dialog"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div
          id="metal_archives_modal_header"
          className="flex items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-zinc-800 bg-zinc-950/50 gap-2"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2.5 bg-red-600/10 border border-red-500/20 rounded-lg sm:rounded-xl text-red-500 shrink-0">
              <Disc className="w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="truncate">Discography & Metadata Importer</span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full shrink-0">
                  Live Sync + Vision OCR
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate hidden sm:block">
                Search live music databases or paste a screenshot of any Metal-Archives tracklist to auto-fill releases
              </p>
            </div>
          </div>
          <button
            id="close_metal_archives_modal_btn"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-lg sm:rounded-xl transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div
          id="metal_archives_tabs"
          className="flex border-b border-zinc-800 bg-zinc-950/40 px-3 sm:px-6 pt-2 sm:pt-3"
        >
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
            <span>Search Live Metadata</span>
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
            <Camera className="w-3.5 h-3.5" />
            <span>Screenshot / Image Paste</span>
            {pastedImages.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                {pastedImages.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div id="metal_archives_modal_body" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'search' ? (
            <form
              id="metal_archives_search_form"
              onSubmit={(e) => handleFetchScrape(e)}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-2">
                  Select Search Engine / Metadata Source
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSource('all');
                      if (scrapeResult && queryUrl) handleFetchScrape(undefined, 'all');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedSource === 'all'
                        ? 'bg-red-600/20 border-red-500 text-red-300 font-bold shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span>🌐 All Sources</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSource('google');
                      if (scrapeResult && queryUrl) handleFetchScrape(undefined, 'google');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedSource === 'google'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span>🔍 Google & Web</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSource('itunes');
                      if (scrapeResult && queryUrl) handleFetchScrape(undefined, 'itunes');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedSource === 'itunes'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span>🍎 Apple Music</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSource('metal-archives');
                      if (scrapeResult && queryUrl) handleFetchScrape(undefined, 'metal-archives');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedSource === 'metal-archives'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span>⚡ Metal Archives</span>
                  </button>
                </div>
              </div>

              <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Band Name, Artist, or Catalog Link
              </label>
              <div className="space-y-3">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="search_query_url_input"
                    type="text"
                    value={queryUrl}
                    onChange={(e) => setQueryUrl(e.target.value)}
                    placeholder="e.g., Aeon, Sanguisugabogg, Dying Fetus, PeelingFlesh..."
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
                      <span>
                        Searching Live Metadata across{' '}
                        {selectedSource === 'all' ? 'All Engines' : selectedSource}...
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Search & Extract Live Discography</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Content-Aware Screenshot / Image & Smart Paste Section */
            <div id="metal_archives_paste_section" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-red-400" />
                    <span>Content-Aware Screenshot & Tracklist Scanner</span>
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Take a screenshot of any Metal-Archives album page, tracklist table, or back cover — paste (Ctrl+V) or upload it below and we&apos;ll extract every track, duration, and album detail automatically.
                  </p>
                </div>
                <a
                  href="https://www.metal-archives.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-red-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Open metal-archives.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Screenshot Drop / Paste Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImage(true);
                }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDraggingImage(false);
                  if (e.dataTransfer?.files?.length) {
                    await handleImageFilesAdded(e.dataTransfer.files);
                  }
                }}
                className={`relative rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all ${
                  isDraggingImage
                    ? 'border-red-500 bg-red-950/20'
                    : pastedImages.length > 0
                    ? 'border-red-500/40 bg-zinc-950/80'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleImageFilesAdded(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />

                {pastedImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-3 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                        Paste Screenshot (<kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-800 rounded border border-zinc-700 font-mono">Ctrl+V</kbd>) or Select Image
                      </p>
                      <p className="text-[11px] text-zinc-500 max-w-md">
                        Works with full album screenshots, cropped tracklist tables, or multi-album discography lists (up to 5 screenshots at once).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Screenshot(s)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleReadClipboardButton}
                        className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Paste from Clipboard</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-red-400 uppercase flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{pastedImages.length} Screenshot{pastedImages.length > 1 ? 's' : ''} Ready for Extraction</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>+ Add More</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPastedImages([])}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 border border-zinc-800 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {pastedImages.map((imgUrl, idx) => (
                        <div
                          key={`pasted-shot-${idx}`}
                          className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center"
                        >
                          <img
                            src={imgUrl}
                            alt={`Screenshot ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPastedImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/80 text-zinc-300 hover:text-red-400 border border-zinc-700 cursor-pointer"
                            title="Remove screenshot"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-zinc-300">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Context Hints (helpful when cropping only the tracklist table) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    Album Title Hint (Optional — Auto-Detected if Visible)
                  </label>
                  <input
                    type="text"
                    value={pasteAlbumTitle}
                    onChange={(e) => setPasteAlbumTitle(e.target.value)}
                    placeholder="e.g., Aeons Black (if cropped out of screenshot)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    Release Year (Optional)
                  </label>
                  <input
                    type="text"
                    value={pasteAlbumYear}
                    onChange={(e) => setPasteAlbumYear(e.target.value)}
                    placeholder="e.g., 2012"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    Release Type
                  </label>
                  <select
                    value={pasteAlbumType}
                    onChange={(e) => setPasteAlbumType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="Full-length">Full-length Album</option>
                    <option value="EP">EP</option>
                    <option value="Demo">Demo</option>
                    <option value="Split">Split</option>
                    <option value="Single">Single</option>
                    <option value="Live">Live Album</option>
                  </select>
                </div>
              </div>

              {/* Optional Text Fallback Box */}
              <details className="group rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-2.5">
                <summary className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center justify-between">
                  <span>Or paste raw copied tracklist / table text (optional)</span>
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="pt-2.5 space-y-2">
                  <textarea
                    id="metal_archives_raw_textarea"
                    rows={4}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Paste messy Metal-Archives tracklist text here (even multi-line rows with "Show lyrics")...`}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </details>

              <button
                id="parse_pasted_text_btn"
                type="button"
                disabled={isLoading || (pastedImages.length === 0 && !pastedText.trim())}
                onClick={handleParseScreenshotOrText}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning Screenshot & Extracting Tracklist + Cover Art...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {pastedImages.length > 0
                        ? `Extract Tracklist & Album Info from ${pastedImages.length} Screenshot${pastedImages.length > 1 ? 's' : ''}`
                        : 'Parse Tracklist & Album Info'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div
              id="metal_archives_error_banner"
              className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-xs"
            >
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
                    <p className="text-xs text-zinc-500">Extracted Catalog</p>
                    <p className="text-sm font-bold text-zinc-200">
                      {scrapeResult.releases.length}{' '}
                      {scrapeResult.releases.length === 1 ? 'release' : 'releases'}
                    </p>
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
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Filter by Release Type
                  </span>
                  <button
                    id="toggle_all_tracks_preview_btn"
                    type="button"
                    onClick={toggleExpandAllTracks}
                    className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      {expandedReleaseIds.size === scrapeResult.releases.length
                        ? 'Collapse Tracklists'
                        : 'Expand All Tracklists'}
                    </span>
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
                      <span
                        className={`w-2 h-2 rounded-full ${
                          filters[type] ? 'bg-red-500' : 'bg-zinc-700'
                        }`}
                      />
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
                  {scrapeResult.releases.map((rel: any, relIdx: number) => {
                    const isSelected = selectedReleaseIds.has(rel.id);
                    const isExpanded = expandedReleaseIds.has(rel.id);
                    const trackCount = rel.tracks?.length || 0;
                    const totalRuntime = calculateTotalDuration(rel.tracks);
                    const coverSrc =
                      rel.cover_url ||
                      rel.cover_image ||
                      rel.coverUrl ||
                      rel.coverImage ||
                      rel.image_url;

                    return (
                      <div
                        key={rel.id ? `rel-${rel.id}-${relIdx}` : `rel-${relIdx}`}
                        className={`transition-colors ${isSelected ? 'bg-red-950/10' : ''}`}
                      >
                        <div
                          onClick={() => toggleSelectRelease(rel.id)}
                          className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-zinc-900/60 transition-colors cursor-pointer gap-2 sm:gap-4"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectRelease(rel.id, e)}
                              className="text-zinc-400 shrink-0 cursor-pointer p-0.5"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                              ) : (
                                <Square className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600" />
                              )}
                            </button>

                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-zinc-850 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                              {coverSrc ? (
                                <img
                                  src={coverSrc}
                                  alt={rel.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Music2 className="w-6 h-6 text-zinc-600" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm sm:text-base font-semibold text-zinc-100 truncate">
                                  {rel.title}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-zinc-400 mt-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[11px] font-medium truncate max-w-[150px] sm:max-w-[220px]">
                                  <Building className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                  <span className="truncate">{rel.label || 'Underground Label'}</span>
                                </span>

                                {rel.catalogId && rel.catalogId !== 'N/A' && (
                                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400 text-[11px] font-mono">
                                    <Tag className="w-2.5 h-2.5 text-zinc-500" />
                                    {rel.catalogId}
                                  </span>
                                )}

                                <span className="text-zinc-600">&middot;</span>
                                <span className="text-zinc-400 text-[11px] whitespace-nowrap">
                                  {trackCount} {trackCount === 1 ? 'track' : 'tracks'} ({totalRuntime})
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 pl-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold ${
                                rel.type === 'Full-length'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : rel.type === 'EP'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : rel.type === 'Demo'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : rel.type === 'Live'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {rel.type}
                            </span>
                            <span className="text-xs font-mono font-medium text-zinc-300 w-11 text-right">
                              {rel.release_date || rel.releaseDate}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleExpandRelease(rel.id, e)}
                              className="p-1 sm:p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title={isExpanded ? 'Hide Tracklist' : 'View Tracklist'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && rel.tracks && rel.tracks.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-6 sm:px-14 py-3 bg-zinc-950/80 border-t border-zinc-800/60"
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
                                      <span className="truncate font-medium text-zinc-200">
                                        {t.title}
                                      </span>
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
        <div
          id="metal_archives_modal_footer"
          className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/50"
        >
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
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
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
                  Import {selectedReleaseIds.size}{' '}
                  {selectedReleaseIds.size === 1 ? 'Release' : 'Releases'} with Full Metadata
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
