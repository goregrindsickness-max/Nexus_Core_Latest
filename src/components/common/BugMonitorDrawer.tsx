import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Bug, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  MousePointer, 
  Activity, 
  Globe, 
  Layers, 
  ChevronRight, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  Search, 
  FileCode,
  Flame,
  ArrowLeft
} from 'lucide-react';
import { bugMonitor, BugReport, BugStatus } from '../../services/bugMonitorService';
import { isMiguelNameOrProfile } from '../social/utils/profileUtils';
import { useModalStore } from '../../store/useModalStore';

interface BugMonitorDrawerProps {
  userProfile?: any;
  activeTab?: string;
  activeBand?: any;
}

export const BugMonitorDrawer: React.FC<BugMonitorDrawerProps> = ({
  userProfile,
  activeTab,
  activeBand
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isStoreOpen = useModalStore(state => state.isBugMonitorOpen);
  const openBugMonitor = useModalStore(state => state.openBugMonitor);
  const closeBugMonitor = useModalStore(state => state.closeBugMonitor);
  const activeOpen = isOpen || isStoreOpen;

  const [reports, setReports] = useState<BugReport[]>([]);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'non_ui_breaking' | 'silent_api' | 'console_error' | 'runtime_exception'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTabSubView, setActiveTabSubView] = useState<'overview' | 'breadcrumbs' | 'network' | 'environment'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mobile master-detail view state ('list' = bug list, 'detail' = active bug deep dive)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Check if owner
  const isOwner = useMemo(() => {
    if (!userProfile) return true; // Fail-open in dev/owner context
    if (userProfile?.email === 'goregrindsickness@gmail.com') return true;
    if (isMiguelNameOrProfile(userProfile)) return true;
    if (userProfile?.name && userProfile.name.toLowerCase().includes('miguel')) return true;
    if (userProfile?.handle && (userProfile.handle.toLowerCase().includes('bdmceo') || userProfile.handle.toLowerCase().includes('goregrinder'))) return true;
    return false;
  }, [userProfile]);

  // Keep user context updated in the background observer
  useEffect(() => {
    bugMonitor.setUserContext({
      userId: userProfile?.id || userProfile?.user_id,
      userEmail: userProfile?.email || 'goregrindsickness@gmail.com',
      routeOrTab: activeTab || 'feed',
      activeBandName: activeBand?.name || activeBand?.band_name,
      activeBandId: activeBand?.id
    });
  }, [userProfile, activeTab, activeBand]);

  // Initial load & subscription to live background events
  const refreshReports = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const live = await bugMonitor.fetchReports();
      setReports(live);
    } catch {
      setReports(bugMonitor.getCachedReports());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    setReports(bugMonitor.getCachedReports());
    refreshReports();

    // Listen to real-time bug capture events
    const handleBugReported = () => {
      refreshReports();
    };

    const handleOpenConsole = () => {
      setIsOpen(true);
      openBugMonitor();
      // Auto refresh upon opening
      refreshReports();
    };

    window.addEventListener('nexus:bug-reported', handleBugReported);
    window.addEventListener('nexus:open-bug-monitor', handleOpenConsole);

    // Global keyboard shortcut: Ctrl+Shift+B or Cmd+Option+B
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') ||
          (e.metaKey && e.altKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        if (activeOpen) {
          setIsOpen(false);
          closeBugMonitor();
        } else {
          setIsOpen(true);
          openBugMonitor();
          refreshReports();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('nexus:bug-reported', handleBugReported);
      window.removeEventListener('nexus:open-bug-monitor', handleOpenConsole);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [refreshReports, activeOpen, openBugMonitor, closeBugMonitor]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    closeBugMonitor();
  }, [closeBugMonitor]);

  // Derived counts
  const unresolvedCount = useMemo(() => {
    return reports.filter(r => r.status !== 'resolved').length;
  }, [reports]);

  const nonUiBreakingCount = useMemo(() => {
    return reports.filter(r => r.isNonUiBreaking && r.status !== 'resolved').length;
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Status filter
      if (statusFilter === 'unresolved' && r.status === 'resolved') return false;
      if (statusFilter === 'resolved' && r.status !== 'resolved') return false;

      // Category filter
      if (filterCategory === 'non_ui_breaking' && !r.isNonUiBreaking) return false;
      if (filterCategory === 'silent_api' && r.category !== 'silent_api') return false;
      if (filterCategory === 'console_error' && r.category !== 'console_error') return false;
      if (filterCategory === 'runtime_exception' && r.category !== 'runtime_exception' && r.category !== 'unhandled_promise') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const msg = (r.message || '').toLowerCase();
        const title = (r.title || '').toLowerCase();
        const ep = (r.endpoint || '').toLowerCase();
        if (!msg.includes(q) && !title.includes(q) && !ep.includes(q)) return false;
      }

      return true;
    });
  }, [reports, statusFilter, filterCategory, searchQuery]);

  const activeBug = useMemo(() => {
    return reports.find(r => r.id === selectedBugId) || filteredReports[0] || null;
  }, [reports, selectedBugId, filteredReports]);

  // Helpers
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateStatus = async (id: string, status: BugStatus) => {
    await bugMonitor.updateBugStatus(id, status);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleDelete = async (id: string) => {
    await bugMonitor.deleteBugReport(id);
    setReports(prev => prev.filter(r => r.id !== id));
    if (selectedBugId === id) {
      setSelectedBugId(null);
      setMobileView('list');
    }
  };

  const handleClearAll = async (mode: 'all' | 'resolved_only') => {
    await bugMonitor.clearReports(mode);
    if (mode === 'all') {
      setReports([]);
      setSelectedBugId(null);
      setMobileView('list');
    } else {
      setReports(prev => prev.filter(r => r.status !== 'resolved'));
    }
  };

  const handleSimulateBug = (type: 'silent_api' | 'console_error' | 'promise_rejection') => {
    bugMonitor.simulateBug(type);
  };

  const formatDiagnosticMarkdown = (bug: BugReport) => {
    return `### [AUTOMATED BUG REPORT] ${bug.title}
- **Category:** ${bug.category} (${bug.isNonUiBreaking ? 'Non-UI Breaking / Silent' : 'UI Fatal'})
- **Severity:** ${bug.severity}
- **Occurrences:** ${bug.occurrences}
- **First Seen:** ${bug.firstSeenAt}
- **Last Seen:** ${bug.lastSeenAt}
${bug.endpoint ? `- **Endpoint:** ${bug.httpMethod || 'GET'} ${bug.endpoint} (Status: ${bug.httpStatus || 'N/A'})` : ''}
${bug.routeOrTab ? `- **Active Tab/Portal:** ${bug.routeOrTab}` : ''}
${bug.activeBandName ? `- **Active Band:** ${bug.activeBandName}` : ''}
- **URL:** ${bug.url}
- **User:** ${bug.userEmail || 'goregrindsickness@gmail.com'}

#### Error Message:
\`\`\`
${bug.message}
\`\`\`

${bug.httpResponseBody ? `#### Response Body:\n\`\`\`json\n${bug.httpResponseBody}\n\`\`\`\n` : ''}

${bug.stack ? `#### Stack Trace:\n\`\`\`\n${bug.stack}\n\`\`\`\n` : ''}

#### Preceding User Breadcrumbs (Last Actions):
${bug.breadcrumbs.slice(-15).map((b, idx) => `${idx + 1}. [${new Date(b.timestamp).toLocaleTimeString()}] (${b.type}) ${b.message}`).join('\n')}
`;
  };

  return (
    <>
      {/* Note: Floating badge was moved into Left Drawer settings menu per user request.
          The inspector opens via Left Drawer settings menu item or Ctrl+Shift+B keyboard shortcut. */}

      {/* FULL RESPONSIVE INSPECTOR CONSOLE MODAL */}
      {activeOpen && (
        <div className="fixed inset-0 z-[1000050] flex flex-col items-center justify-center p-0 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-zinc-950 border-0 md:border md:border-zinc-800 rounded-none md:rounded-xl shadow-2xl w-full max-w-6xl h-[100dvh] md:h-[90vh] flex flex-col overflow-hidden text-zinc-100">
            
            {/* TOP HEADER - RESPONSIVE FOR MOBILE */}
            <header className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900/70 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-100 truncate">
                      Bug Diagnostics
                    </h2>
                    <span className="hidden sm:inline text-xs text-zinc-500 font-mono">
                      · Shake & Instabug Observer
                    </span>
                    {unresolvedCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded">
                        {unresolvedCount} active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 hidden sm:flex items-center gap-2 mt-0.5">
                    <span>Active Observer: Catches silent API 4xx/5xx & console errors</span>
                    <span className="text-zinc-600">·</span>
                    <span className="font-mono text-zinc-500 text-[10px]">Ctrl+Shift+B</span>
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Test Bug Button */}
                <button
                  onClick={() => handleSimulateBug('silent_api')}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/30 border border-amber-800/50 rounded-lg hover:bg-amber-900/40 hover:border-amber-700 transition-colors"
                  title="Dispatches a simulated silent API 500 error to test background capture"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden xs:inline">Test Bug</span>
                </button>

                {/* Refresh */}
                <button
                  onClick={refreshReports}
                  disabled={isRefreshing}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-colors"
                  title="Refresh Reports"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-zinc-200' : ''}`} />
                </button>

                {/* Close */}
                <button
                  onClick={handleClose}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-colors"
                  title="Close Console"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </header>

            {/* FILTER & SEARCH BAR - HORIZONTALLY SCROLLABLE ON MOBILE */}
            <div className="bg-zinc-900/50 border-b border-zinc-800 shrink-0 flex flex-col">
              {/* Category Segmented Scrollable Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 sm:px-6 py-2 shrink-0">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    filterCategory === 'all' ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800/80'
                  }`}
                >
                  All ({reports.length})
                </button>
                <button
                  onClick={() => setFilterCategory('non_ui_breaking')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    filterCategory === 'non_ui_breaking' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800/80'
                  }`}
                >
                  <Activity className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Silent / Non-UI ({reports.filter(r => r.isNonUiBreaking).length})</span>
                </button>
                <button
                  onClick={() => setFilterCategory('silent_api')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    filterCategory === 'silent_api' ? 'bg-sky-950/50 text-sky-300 border border-sky-800/50' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800/80'
                  }`}
                >
                  API 4xx/5xx ({reports.filter(r => r.category === 'silent_api').length})
                </button>
                <button
                  onClick={() => setFilterCategory('console_error')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    filterCategory === 'console_error' ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800/80'
                  }`}
                >
                  Console ({reports.filter(r => r.category === 'console_error').length})
                </button>
                <button
                  onClick={() => setFilterCategory('runtime_exception')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    filterCategory === 'runtime_exception' ? 'bg-rose-950/50 text-rose-300 border border-rose-800/50' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800/80'
                  }`}
                >
                  Fatal ({reports.filter(r => r.category === 'runtime_exception' || r.category === 'unhandled_promise').length})
                </button>
              </div>

              {/* Search & Status Controls Row */}
              <div className="flex items-center gap-2 px-3 sm:px-6 py-2 border-t border-zinc-800/60 bg-zinc-950/40">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search error, endpoint, URL..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="shrink-0 px-2.5 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                >
                  <option value="unresolved">Unresolved</option>
                  <option value="all">All</option>
                  <option value="resolved">Resolved</option>
                </select>

                {reports.some(r => r.status === 'resolved') && (
                  <button
                    onClick={() => handleClearAll('resolved_only')}
                    className="shrink-0 px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
                    title="Clear resolved bugs"
                  >
                    Clear Resolved
                  </button>
                )}
              </div>
            </div>

            {/* MAIN WORKSPACE - MOBILE MASTER-DETAIL & DESKTOP DUAL-COLUMN */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* BUG REPORT LIST COLUMN */}
              {/* On mobile: visible only when mobileView === 'list'. On desktop (md:): always visible */}
              <div className={`w-full md:w-96 md:border-r border-zinc-800 flex flex-col bg-zinc-950/70 shrink-0 ${
                mobileView === 'list' ? 'flex' : 'hidden md:flex'
              }`}>
                <div className="p-3 border-b border-zinc-800/60 text-xs text-zinc-400 flex items-center justify-between shrink-0">
                  <span className="font-mono tabular-nums text-zinc-400 font-medium">{filteredReports.length} reports</span>
                  {reports.length > 0 && (
                    <button
                      onClick={() => handleClearAll('all')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
                  {filteredReports.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 space-y-2.5">
                      <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs font-medium text-zinc-400">No bugs match current filters</p>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        The Shake/Instabug observer is actively monitoring network requests and console errors in the background.
                      </p>
                      <button
                        onClick={() => handleSimulateBug('silent_api')}
                        className="mt-3 px-3 py-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-lg hover:bg-amber-900/40 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Trigger Test Bug</span>
                      </button>
                    </div>
                  ) : (
                    filteredReports.map(bug => {
                      const isSelected = activeBug?.id === bug.id;
                      const isResolved = bug.status === 'resolved';

                      return (
                        <div
                          key={bug.id}
                          onClick={() => {
                            setSelectedBugId(bug.id);
                            setMobileView('detail');
                          }}
                          className={`p-3.5 sm:p-4 cursor-pointer transition-colors text-left border-l-2 active:bg-zinc-900/80 ${
                            isSelected
                              ? 'bg-zinc-900/90 border-rose-500'
                              : 'hover:bg-zinc-900/50 border-transparent'
                          } ${isResolved ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                              {bug.category === 'silent_api' ? (
                                <Server className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              ) : bug.category === 'console_error' ? (
                                <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              )}
                              <span className="truncate uppercase font-medium">
                                {bug.category.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {bug.occurrences > 1 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded border border-zinc-700">
                                  ×{bug.occurrences}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-500 font-mono tabular-nums">
                                {new Date(bug.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-xs sm:text-sm font-medium text-zinc-200 mt-1.5 line-clamp-2 leading-relaxed">
                            {bug.title}
                          </h3>

                          <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-[11px] text-zinc-500 font-mono flex-wrap">
                            {bug.isNonUiBreaking ? (
                              <span className="text-amber-400 font-medium">Silent / Non-Breaking</span>
                            ) : (
                              <span className="text-rose-400 font-medium">UI Impact</span>
                            )}
                            {bug.httpStatus && (
                              <>
                                <span>·</span>
                                <span className="text-zinc-400">HTTP {bug.httpStatus}</span>
                              </>
                            )}
                            {bug.status === 'resolved' && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-400 font-medium">Resolved</span>
                              </>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 ml-auto md:hidden" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* DEEP DIVE DIAGNOSTIC INSPECTOR COLUMN */}
              {/* On mobile: visible only when mobileView === 'detail'. On desktop: always visible */}
              <div className={`flex-1 flex flex-col overflow-y-auto bg-zinc-950 ${
                mobileView === 'detail' ? 'flex' : 'hidden md:flex'
              }`}>
                {activeBug ? (
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    
                    {/* MOBILE BACK TO LIST BAR */}
                    <div className="flex md:hidden items-center justify-between pb-3 border-b border-zinc-800">
                      <button
                        onClick={() => setMobileView('list')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>All Reports ({filteredReports.length})</span>
                      </button>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {activeBug.category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* TOP ACTION BAR FOR SELECTED BUG */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 flex-wrap">
                          <span className="text-zinc-500 text-[11px]">ID: {activeBug.id}</span>
                          <span>·</span>
                          <span className="text-[11px]">{new Date(activeBug.firstSeenAt).toLocaleTimeString()}</span>
                          <span>·</span>
                          <span className="text-zinc-300 font-bold">Seen ×{activeBug.occurrences}</span>
                        </div>
                        <h1 className="text-sm sm:text-base font-semibold text-zinc-100 mt-1 break-words leading-snug">
                          {activeBug.title}
                        </h1>
                      </div>

                      {/* Action buttons (optimized for touch on mobile) */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* Copy markdown prompt for chat/AI */}
                        <button
                          onClick={() => handleCopy(formatDiagnosticMarkdown(activeBug), 'ai-report')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/40 active:scale-95 transition-all shadow-sm"
                          title="Copy full diagnostic markdown prompt ready to paste into chat"
                        >
                          {copiedKey === 'ai-report' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>{copiedKey === 'ai-report' ? 'Copied Prompt!' : 'Copy for AI Fix'}</span>
                        </button>

                        {/* Status Toggle */}
                        {activeBug.status === 'resolved' ? (
                          <button
                            onClick={() => handleUpdateStatus(activeBug.id, 'new')}
                            className="px-3 py-2 sm:py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 active:scale-95 transition-all"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(activeBug.id, 'resolved')}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-medium text-emerald-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-emerald-950/40 active:scale-95 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Resolved</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(activeBug.id)}
                          className="p-2 sm:p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* SUB-VIEW TABS - HORIZONTALLY SCROLLABLE ON MOBILE */}
                    <div className="flex items-center gap-4 sm:gap-6 border-b border-zinc-800 text-xs overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
                      <button
                        onClick={() => setActiveTabSubView('overview')}
                        className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 shrink-0 ${
                          activeTabSubView === 'overview'
                            ? 'text-zinc-100 border-rose-500 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200 border-transparent'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Overview & Stack</span>
                      </button>
                      <button
                        onClick={() => setActiveTabSubView('breadcrumbs')}
                        className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 shrink-0 ${
                          activeTabSubView === 'breadcrumbs'
                            ? 'text-zinc-100 border-rose-500 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200 border-transparent'
                        }`}
                      >
                        <MousePointer className="w-3.5 h-3.5" />
                        <span>Breadcrumbs ({activeBug.breadcrumbs.length})</span>
                      </button>
                      {activeBug.endpoint && (
                        <button
                          onClick={() => setActiveTabSubView('network')}
                          className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 shrink-0 ${
                            activeTabSubView === 'network'
                              ? 'text-zinc-100 border-rose-500 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 border-transparent'
                          }`}
                        >
                          <Server className="w-3.5 h-3.5" />
                          <span>Network Payload</span>
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTabSubView('environment')}
                        className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 shrink-0 ${
                          activeTabSubView === 'environment'
                            ? 'text-zinc-100 border-rose-500 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200 border-transparent'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Environment</span>
                      </button>
                    </div>

                    {/* SUB-VIEW 1: OVERVIEW & STACK TRACE */}
                    {activeTabSubView === 'overview' && (
                      <div className="space-y-4">
                        {/* Error Message Box */}
                        <div className="p-3.5 sm:p-4 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                            <span className="font-mono text-zinc-500 uppercase tracking-wider text-[10px] sm:text-xs">Error Message</span>
                            <button
                              onClick={() => handleCopy(activeBug.message, 'msg')}
                              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-800"
                            >
                              {copiedKey === 'msg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedKey === 'msg' ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <div className="text-xs sm:text-sm font-mono text-rose-300 whitespace-pre-wrap leading-relaxed select-text break-words">
                            {activeBug.message}
                          </div>
                        </div>

                        {/* Stack Trace */}
                        {activeBug.stack ? (
                          <div className="p-3.5 sm:p-4 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                              <span className="font-mono text-zinc-500 uppercase tracking-wider text-[10px] sm:text-xs">Stack Trace</span>
                              <button
                                onClick={() => handleCopy(activeBug.stack || '', 'stack')}
                                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-800"
                              >
                                {copiedKey === 'stack' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === 'stack' ? 'Copied' : 'Copy Stack'}</span>
                              </button>
                            </div>
                            <pre className="text-[11px] sm:text-xs font-mono text-zinc-300 max-h-72 sm:max-h-80 overflow-x-auto whitespace-pre leading-relaxed select-text p-2.5 sm:p-3 bg-black/50 rounded border border-zinc-800/80">
                              {activeBug.stack}
                            </pre>
                          </div>
                        ) : (
                          <div className="p-3.5 sm:p-4 text-xs text-zinc-500 italic bg-zinc-900/40 rounded-lg border border-zinc-800/60">
                            No JavaScript stack trace captured for this event (standard for silent HTTP API errors or string warnings).
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-VIEW 2: BREADCRUMBS TIMELINE */}
                    {activeTabSubView === 'breadcrumbs' && (
                      <div className="space-y-3">
                        <div className="text-xs text-zinc-400 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] sm:text-xs">User actions and events leading up to error:</span>
                          <button
                            onClick={() => handleCopy(JSON.stringify(activeBug.breadcrumbs, null, 2), 'bc-json')}
                            className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-800"
                          >
                            {copiedKey === 'bc-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy Breadcrumbs JSON</span>
                          </button>
                        </div>

                        <div className="border border-zinc-800 rounded-lg divide-y divide-zinc-800/80 bg-zinc-900/30 overflow-hidden">
                          {activeBug.breadcrumbs.length === 0 ? (
                            <div className="p-4 text-xs text-zinc-500">No breadcrumbs recorded.</div>
                          ) : (
                            activeBug.breadcrumbs.map((bc, idx) => (
                              <div key={bc.id || idx} className="p-2.5 sm:p-3 text-xs flex items-start gap-2.5 sm:gap-3 hover:bg-zinc-900/50 transition-colors">
                                <span className="font-mono text-zinc-600 text-[10px] sm:text-[11px] w-5 shrink-0 tabular-nums pt-0.5">
                                  {idx + 1}.
                                </span>
                                <div className="shrink-0 mt-0.5">
                                  {bc.type === 'click' ? (
                                    <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : bc.type === 'network' ? (
                                    <Server className="w-3.5 h-3.5 text-sky-400" />
                                  ) : bc.type === 'console' ? (
                                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                                  ) : (
                                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                                      {bc.category || bc.type}
                                    </span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="font-mono text-[9px] sm:text-[10px] text-zinc-500 tabular-nums">
                                      {new Date(bc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-zinc-200 font-mono text-[11px] sm:text-xs mt-0.5 break-words leading-relaxed">
                                    {bc.message}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 3: NETWORK PAYLOAD */}
                    {activeTabSubView === 'network' && activeBug.endpoint && (
                      <div className="space-y-4">
                        <div className="p-3.5 sm:p-4 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs font-mono">
                            <div>
                              <span className="text-zinc-500 block uppercase text-[9px] sm:text-[10px]">Method</span>
                              <span className="text-zinc-200 font-bold">{activeBug.httpMethod || 'GET'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block uppercase text-[9px] sm:text-[10px]">HTTP Status</span>
                              <span className={`font-bold ${activeBug.httpStatus && activeBug.httpStatus >= 500 ? 'text-rose-400' : 'text-amber-400'}`}>
                                {activeBug.httpStatus || 'Failed'}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-zinc-500 block uppercase text-[9px] sm:text-[10px]">Endpoint</span>
                              <span className="text-zinc-200 break-all">{activeBug.endpoint}</span>
                            </div>
                          </div>

                          {activeBug.httpResponseBody && (
                            <div className="mt-4 pt-3 border-t border-zinc-800">
                              <span className="text-zinc-500 block uppercase text-[9px] sm:text-[10px] font-mono mb-1">Response Body Preview</span>
                              <pre className="text-[11px] sm:text-xs font-mono text-zinc-300 p-2.5 sm:p-3 bg-black/50 rounded border border-zinc-800 max-h-60 overflow-y-auto whitespace-pre-wrap select-text break-words">
                                {activeBug.httpResponseBody}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 4: ENVIRONMENT & CONTEXT */}
                    {activeTabSubView === 'environment' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-3.5 sm:p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs space-y-2.5 font-mono">
                          <span className="text-zinc-500 uppercase tracking-wider block text-[9px] sm:text-[10px] font-bold">Application State</span>
                          <div>
                            <span className="text-zinc-500 block text-[11px]">Current Route / Tab:</span>
                            <span className="text-zinc-200 break-words">{activeBug.routeOrTab || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[11px]">Active Band:</span>
                            <span className="text-zinc-200 break-words">{activeBug.activeBandName || 'None selected'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[11px]">User Account:</span>
                            <span className="text-zinc-200 break-words">{activeBug.userEmail || 'goregrindsickness@gmail.com'}</span>
                          </div>
                        </div>

                        <div className="p-3.5 sm:p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs space-y-2.5 font-mono">
                          <span className="text-zinc-500 uppercase tracking-wider block text-[9px] sm:text-[10px] font-bold">Device & Network</span>
                          <div>
                            <span className="text-zinc-500 block text-[11px]">Viewport Resolution:</span>
                            <span className="text-zinc-200 tabular-nums">{activeBug.viewport?.width} × {activeBug.viewport?.height}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[11px]">Connection Status:</span>
                            <span className={activeBug.online ? 'text-emerald-400' : 'text-rose-400'}>
                              {activeBug.online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[11px]">User Agent:</span>
                            <span className="text-zinc-400 text-[10px] break-all">{activeBug.userAgent}</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs p-6 text-center">
                    Select a bug report from the list to inspect detailed diagnostics and breadcrumbs.
                  </div>
                )}
              </div>

            </div>

            {/* BOTTOM FOOTER / STATUS BAR - MINIMAL & CLEAN ON MOBILE */}
            <footer className="px-3.5 sm:px-6 py-2 sm:py-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 shrink-0 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-300 font-medium">Observer Active</span>
                <span className="text-zinc-700 hidden sm:inline">·</span>
                <span className="hidden sm:inline">Capturing silent errors</span>
              </div>
              <div>
                <span className="hidden sm:inline">Shortcut: <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded border border-zinc-700 text-[10px]">Ctrl+Shift+B</kbd></span>
                <span className="sm:hidden text-zinc-500">Auto-synced</span>
              </div>
            </footer>

          </div>
        </div>
      )}
    </>
  );
};
