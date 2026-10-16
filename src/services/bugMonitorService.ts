// Autonomous Shake & Instabug Bug Monitoring Engine for Web
// Automatically captures non-UI breaking bugs, silent fetch failures, console errors,
// unhandled rejections, user breadcrumbs, and environmental snapshots.

export interface Breadcrumb {
  id: string;
  type: 'click' | 'navigation' | 'network' | 'console' | 'user_action' | 'lifecycle';
  category?: string;
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export type BugCategory = 
  | 'silent_api' 
  | 'console_error' 
  | 'unhandled_promise' 
  | 'runtime_exception' 
  | 'audio_media'
  | 'sync_storage'
  | 'custom_caught';

export type BugStatus = 'new' | 'investigating' | 'resolved' | 'archived';

export interface BugReport {
  id: string;
  fingerprint: string;
  title: string;
  message: string;
  category: BugCategory;
  severity: BugSeverity;
  isNonUiBreaking: boolean;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  status: BugStatus;
  stack?: string;
  componentStack?: string;
  endpoint?: string;
  httpMethod?: string;
  httpStatus?: number;
  httpResponseBody?: string;
  url: string;
  routeOrTab: string;
  activeBandName?: string;
  activeBandId?: string;
  userEmail?: string;
  userId?: string;
  userAgent: string;
  viewport: { width: number; height: number };
  online: boolean;
  breadcrumbs: Breadcrumb[];
}

export interface UserContext {
  userEmail?: string;
  userId?: string;
  activeBandName?: string;
  activeBandId?: string;
  routeOrTab?: string;
}

const LOCAL_STORAGE_KEY = 'nexus_bug_reports_cache';
const MAX_BREADCRUMBS = 35;
const MAX_LOCAL_REPORTS = 100;
const DEDUPLICATION_WINDOW_MS = 60000; // 1 minute window for occurrence bundling

class BugMonitorService {
  private isInitialized = false;
  private breadcrumbs: Breadcrumb[] = [];
  private userContext: UserContext = {};
  private originalConsoleError: typeof console.error | null = null;
  private originalConsoleWarn: typeof console.warn | null = null;
  private originalFetch: typeof window.fetch | null = null;
  private inFlightBugReports = new Set<string>();

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    this.addBreadcrumb({
      type: 'lifecycle',
      category: 'monitor',
      message: 'Bug monitor initialized (Shake & Instabug observation mode active)'
    });

    this.setupWindowListeners();
    this.interceptConsole();
    this.interceptFetch();
    this.setupUserInteractionListener();
  }

  public setUserContext(context: Partial<UserContext>) {
    this.userContext = { ...this.userContext, ...context };
  }

  public addBreadcrumb(crumb: Omit<Breadcrumb, 'id' | 'timestamp'>) {
    const item: Breadcrumb = {
      ...crumb,
      id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.breadcrumbs.push(item);
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  public getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  private setupWindowListeners() {
    // 1. Uncaught Runtime Errors
    window.addEventListener('error', (event: ErrorEvent) => {
      // Ignore cross-origin script error or extension errors
      if (!event.message || event.message === 'Script error.') return;
      if (
        event.message.includes('WebSocket') ||
        (event.filename && event.filename.includes('@vite/client')) ||
        (event.filename && (event.filename.includes('chrome-extension://') || event.filename.includes('moz-extension://')))
      ) {
        return;
      }

      this.addBreadcrumb({
        type: 'lifecycle',
        category: 'window.error',
        message: `Runtime Error: ${event.message}`,
        data: { filename: event.filename, lineno: event.lineno, colno: event.colno }
      });

      this.recordBug({
        title: `Uncaught Error: ${event.message.slice(0, 70)}`,
        message: event.message,
        stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        category: 'runtime_exception',
        severity: 'critical',
        isNonUiBreaking: false
      });
    });

    // 2. Unhandled Promise Rejections (Often non-UI breaking!)
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      let message = 'Unhandled Promise Rejection';
      let stack = '';

      if (typeof reason === 'string') {
        message = reason;
      } else if (reason instanceof Error) {
        message = reason.message || 'Error in Promise';
        stack = reason.stack || '';
      } else if (reason && typeof reason === 'object') {
        try {
          message = JSON.stringify(reason);
        } catch {
          message = String(reason);
        }
      }

      // Ignore standard cancellation / abort errors and benign development environment WebSocket noise
      if (
        message.includes('AbortError') || 
        message.includes('cancelled') || 
        message.includes('canceled') ||
        message.includes('WebSocket closed without opened') ||
        message.includes('failed to connect to websocket') ||
        message.includes('WebSocket') ||
        stack.includes('@vite/client') ||
        message.includes('@vite/client')
      ) {
        return;
      }

      this.addBreadcrumb({
        type: 'lifecycle',
        category: 'unhandledrejection',
        message: `Unhandled Rejection: ${message.slice(0, 100)}`
      });

      this.recordBug({
        title: `Promise Rejection: ${message.slice(0, 70)}`,
        message,
        stack,
        category: 'unhandled_promise',
        severity: 'high',
        isNonUiBreaking: true // Background promise failure usually does not unmount React!
      });
    });
  }

  private interceptConsole() {
    if (!this.originalConsoleError) {
      this.originalConsoleError = console.error.bind(console);
      console.error = (...args: any[]) => {
        // Always invoke original console.error
        if (this.originalConsoleError) {
          this.originalConsoleError(...args);
        }

        try {
          // Extract message and check if should be ignored
          const firstArg = args[0];
          const rawMessage = args.map(a => {
            if (typeof a === 'string') return a;
            if (a instanceof Error) return `${a.message}\n${a.stack || ''}`;
            try { return JSON.stringify(a); } catch { return String(a); }
          }).join(' ');

          // Filter out benign noise and development environment WebSocket disconnects
          if (
            rawMessage.includes('Download the React DevTools') ||
            rawMessage.includes('[HMR]') ||
            rawMessage.includes('[vite]') ||
            rawMessage.includes('failed to connect to websocket') ||
            rawMessage.includes('WebSocket connection to') ||
            rawMessage.includes('WebSocket closed without opened') ||
            rawMessage.includes('WebSocket') ||
            rawMessage.includes('@vite/client') ||
            rawMessage.includes('favicon.ico')
          ) {
            return;
          }

          let stack = '';
          const errorObj = args.find(a => a instanceof Error);
          if (errorObj) {
            stack = errorObj.stack || '';
          } else {
            // Generate synthetic stack trace to know where console.error was called
            const synError = new Error();
            stack = synError.stack ? synError.stack.split('\n').slice(2).join('\n') : '';
          }

          this.addBreadcrumb({
            type: 'console',
            category: 'console.error',
            message: rawMessage.slice(0, 120)
          });

          // Non-UI breaking: caught in code and logged to console!
          this.recordBug({
            title: `Console Error: ${(typeof firstArg === 'string' ? firstArg : rawMessage).slice(0, 70)}`,
            message: rawMessage,
            stack,
            category: 'console_error',
            severity: 'medium',
            isNonUiBreaking: true
          });
        } catch {}
      };
    }
  }

  private interceptFetch() {
    if (typeof window === 'undefined' || !window.fetch) return;
    this.originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || 'GET').toUpperCase();

      // Don't intercept bug-reporting itself to prevent infinite loops
      const isBugReportUrl = urlString.includes('/api/bug-reports');

      if (!isBugReportUrl) {
        this.addBreadcrumb({
          type: 'network',
          category: 'fetch:start',
          message: `${method} ${urlString.slice(0, 80)}`,
          data: { url: urlString, method }
        });
      }

      try {
        const response = await (this.originalFetch as typeof window.fetch)(input, init);

        if (!isBugReportUrl) {
          // If response is an HTTP error (4xx or 5xx)
          if (!response.ok) {
            let responseBodyPreview = '';
            try {
              const clone = response.clone();
              responseBodyPreview = (await clone.text()).slice(0, 1000);
            } catch {}

            this.addBreadcrumb({
              type: 'network',
              category: 'fetch:error',
              message: `${method} ${urlString.slice(0, 80)} -> HTTP ${response.status} ${response.statusText}`,
              data: { status: response.status, body: responseBodyPreview.slice(0, 150) }
            });

            // Automatically record silent API failure!
            this.recordBug({
              title: `API Error ${response.status}: ${method} ${urlString.split('?')[0].slice(-50)}`,
              message: `Network request to ${urlString} failed with status ${response.status} (${response.statusText}). Response: ${responseBodyPreview || 'No response body'}`,
              category: 'silent_api',
              severity: response.status >= 500 ? 'high' : 'medium',
              isNonUiBreaking: true,
              endpoint: urlString,
              httpMethod: method,
              httpStatus: response.status,
              httpResponseBody: responseBodyPreview
            });
          } else {
            this.addBreadcrumb({
              type: 'network',
              category: 'fetch:ok',
              message: `${method} ${urlString.slice(0, 80)} -> ${response.status}`,
              data: { status: response.status }
            });
          }
        }

        return response;
      } catch (err: any) {
        if (!isBugReportUrl) {
          this.addBreadcrumb({
            type: 'network',
            category: 'fetch:network_failure',
            message: `${method} ${urlString.slice(0, 80)} failed: ${err.message || 'Network error'}`,
            data: { error: err.message }
          });

          // Network or CORS or DNS failure
          this.recordBug({
            title: `Network Failure: ${method} ${urlString.split('?')[0].slice(-50)}`,
            message: `Failed to execute fetch to ${urlString}: ${err.message || 'Connection failed'}`,
            stack: err.stack || '',
            category: 'silent_api',
            severity: 'high',
            isNonUiBreaking: true,
            endpoint: urlString,
            httpMethod: method
          });
        }
        throw err;
      }
    };
  }

  private setupUserInteractionListener() {
    window.addEventListener('click', (event: MouseEvent) => {
      try {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        // Find nearest meaningful interactive element
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], [role="tab"], [data-action]');
        const el = interactive || target;

        const tagName = el.tagName.toLowerCase();
        const textContent = (el.textContent || '').trim().slice(0, 40);
        const ariaLabel = el.getAttribute('aria-label');
        const title = el.getAttribute('title');
        const id = el.id ? `#${el.id}` : '';
        const name = (el as HTMLInputElement).name ? `[name="${(el as HTMLInputElement).name}"]` : '';

        const identifier = ariaLabel || title || textContent || id || name || tagName;

        this.addBreadcrumb({
          type: 'click',
          category: 'ui',
          message: `Clicked <${tagName}> "${identifier.replace(/\s+/g, ' ')}"`,
          data: { tagName, id: el.id, classes: el.className?.toString().slice(0, 60) }
        });
      } catch {}
    }, { capture: true, passive: true });
  }

  // Record and process a bug
  public async recordBug(params: {
    title: string;
    message: string;
    category: BugCategory;
    severity?: BugSeverity;
    isNonUiBreaking?: boolean;
    stack?: string;
    componentStack?: string;
    endpoint?: string;
    httpMethod?: string;
    httpStatus?: number;
    httpResponseBody?: string;
  }) {
    try {
      const now = new Date().toISOString();
      const messageClean = (params.message || '').trim();
      const endpoint = params.endpoint || '';
      const category = params.category || 'runtime_exception';

      // Global safety filter for benign Vite dev environment noise
      if (
        messageClean.includes('WebSocket closed without opened') ||
        messageClean.includes('failed to connect to websocket') ||
        messageClean.includes('@vite/client') ||
        (params.title && params.title.includes('WebSocket')) ||
        (params.stack && params.stack.includes('@vite/client'))
      ) {
        return;
      }

      // Generate deterministic fingerprint for deduplication
      const fingerprint = `${category}::${endpoint || ''}::${messageClean.slice(0, 100).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')}`;

      // Prevent concurrent duplicate spam within milliseconds
      if (this.inFlightBugReports.has(fingerprint)) return;
      this.inFlightBugReports.add(fingerprint);
      setTimeout(() => this.inFlightBugReports.delete(fingerprint), 1500);

      const localReports = this.getCachedReports();
      const existing = localReports.find(r => r.fingerprint === fingerprint);

      let report: BugReport;

      if (existing) {
        existing.occurrences = (existing.occurrences || 1) + 1;
        existing.lastSeenAt = now;
        existing.breadcrumbs = this.getBreadcrumbs();
        if (params.stack && !existing.stack) existing.stack = params.stack;
        if (params.httpResponseBody) existing.httpResponseBody = params.httpResponseBody;
        report = existing;
      } else {
        report = {
          id: `bug-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fingerprint,
          title: params.title || messageClean.slice(0, 60),
          message: messageClean,
          category,
          severity: params.severity || (params.isNonUiBreaking === false ? 'critical' : 'medium'),
          isNonUiBreaking: params.isNonUiBreaking !== undefined ? params.isNonUiBreaking : true,
          occurrences: 1,
          firstSeenAt: now,
          lastSeenAt: now,
          status: 'new',
          stack: params.stack || '',
          componentStack: params.componentStack || '',
          endpoint: params.endpoint,
          httpMethod: params.httpMethod,
          httpStatus: params.httpStatus,
          httpResponseBody: params.httpResponseBody,
          url: typeof window !== 'undefined' ? window.location.href : '',
          routeOrTab: this.userContext.routeOrTab || (typeof window !== 'undefined' ? window.location.pathname : ''),
          activeBandName: this.userContext.activeBandName,
          activeBandId: this.userContext.activeBandId,
          userEmail: this.userContext.userEmail,
          userId: this.userContext.userId,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          viewport: typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : { width: 0, height: 0 },
          online: typeof navigator !== 'undefined' ? navigator.onLine : true,
          breadcrumbs: this.getBreadcrumbs()
        };
        localReports.unshift(report);
      }

      // Save locally
      this.saveCachedReports(localReports.slice(0, MAX_LOCAL_REPORTS));

      // Dispatch browser event so Shake/Instabug UI responds in real time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus:bug-reported', { detail: report }));
      }

      // Send to server in background
      this.syncReportToServer(report);
    } catch (e) {
      if (this.originalConsoleError) {
        this.originalConsoleError('[BugMonitor] Failed to record bug:', e);
      }
    }
  }

  // Send single report to backend
  private async syncReportToServer(report: BugReport) {
    if (!this.originalFetch) return;
    try {
      await this.originalFetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch {}
  }

  // Local storage helpers
  public getCachedReports(): BugReport[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(r => 
          !r.message?.includes('WebSocket closed without opened') &&
          !r.message?.includes('failed to connect to websocket') &&
          !r.title?.includes('WebSocket') &&
          !r.stack?.includes('@vite/client')
        );
      }
      return [];
    } catch {
      return [];
    }
  }

  private saveCachedReports(reports: BugReport[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
    } catch {}
  }

  // Fetch reports from backend (with local fallback)
  public async fetchReports(): Promise<BugReport[]> {
    try {
      const res = await (this.originalFetch || window.fetch)('/api/bug-reports');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.reports)) {
          const filtered = data.reports.filter((r: BugReport) =>
            !r.message?.includes('WebSocket closed without opened') &&
            !r.message?.includes('failed to connect to websocket') &&
            !r.title?.includes('WebSocket') &&
            !r.stack?.includes('@vite/client')
          );
          this.saveCachedReports(filtered);
          return filtered;
        }
      }
    } catch {}
    return this.getCachedReports();
  }

  // Update status (resolved, investigating, etc.)
  public async updateBugStatus(id: string, status: BugStatus): Promise<void> {
    const reports = this.getCachedReports();
    const target = reports.find(r => r.id === id);
    if (target) {
      target.status = status;
      this.saveCachedReports(reports);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus:bug-reported', { detail: target }));
      }
    }

    try {
      await (this.originalFetch || window.fetch)(`/api/bug-reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {}
  }

  // Delete bug report
  public async deleteBugReport(id: string): Promise<void> {
    const reports = this.getCachedReports().filter(r => r.id !== id);
    this.saveCachedReports(reports);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus:bug-reported', { detail: { id, deleted: true } }));
    }

    try {
      await (this.originalFetch || window.fetch)(`/api/bug-reports/${id}`, {
        method: 'DELETE'
      });
    } catch {}
  }

  // Clear all or resolved
  public async clearReports(mode: 'all' | 'resolved_only' = 'all'): Promise<void> {
    if (mode === 'all') {
      this.saveCachedReports([]);
    } else {
      const reports = this.getCachedReports().filter(r => r.status !== 'resolved');
      this.saveCachedReports(reports);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus:bug-reported', { detail: { cleared: true } }));
    }

    try {
      await (this.originalFetch || window.fetch)('/api/bug-reports/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
    } catch {}
  }

  // Simulate a silent, non-UI breaking bug on demand for testing
  public simulateBug(type: 'silent_api' | 'console_error' | 'promise_rejection' = 'silent_api') {
    this.addBreadcrumb({
      type: 'user_action',
      category: 'testing',
      message: `Triggered simulated bug test: ${type}`
    });

    if (type === 'silent_api') {
      // Simulate failed release sync API
      this.recordBug({
        title: 'API Error 500: POST /api/releases/sync-band',
        message: 'Failed to sync releases with remote database: SyntaxError: Unexpected token < in JSON at position 0 (HTTP 500 Internal Server Error)',
        category: 'silent_api',
        severity: 'high',
        isNonUiBreaking: true,
        endpoint: '/api/releases/sync-band',
        httpMethod: 'POST',
        httpStatus: 500,
        httpResponseBody: '{"error": "Database lock timeout during sync"}'
      });
    } else if (type === 'console_error') {
      console.error(
        '[Putrid Pile Discography Sync Warning]: Failed to match track duration metadata for release rel-pp-1. Track 3 duration was null.'
      );
    } else {
      setTimeout(() => {
        Promise.reject(new Error('Background audio player stream buffer underrun in audioService.ts:42'));
      }, 50);
    }
  }
}

export const bugMonitor = new BugMonitorService();
