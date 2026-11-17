import { vi } from 'vitest';

export const DEFAULT_SUPABASE_URL = 'https://mock.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'mock-supabase-anon-key-deterministic';
export const SUPABASE_URL = DEFAULT_SUPABASE_URL;
export const SUPABASE_KEY = DEFAULT_SUPABASE_ANON_KEY;

type RowRecord = Record<string, any>;

const tableStore: Record<string, RowRecord[]> = {};

let mockSession: any = {
  access_token: 'mock-access-token-deterministic',
  refresh_token: 'mock-refresh-token-deterministic',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'test@nexuscore.app',
    role: 'authenticated',
  },
};

export function resetSupabaseMockStore(): void {
  for (const key of Object.keys(tableStore)) {
    delete tableStore[key];
  }
  mockSession = {
    access_token: 'mock-access-token-deterministic',
    refresh_token: 'mock-refresh-token-deterministic',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'test@nexuscore.app',
      role: 'authenticated',
    },
  };
}

export function seedSupabaseTable(tableName: string, rows: RowRecord[]): void {
  tableStore[tableName] = rows.map((r) => ({ ...r }));
}

export function getSupabaseTableRows(tableName: string): RowRecord[] {
  return (tableStore[tableName] || []).map((r) => ({ ...r }));
}

export function setMockAuthSession(session: any): void {
  mockSession = session;
}

export function getMockAuthSession(): any {
  return mockSession;
}

function createQueryBuilder(tableName: string) {
  if (!tableStore[tableName]) {
    tableStore[tableName] = [];
  }

  let operation: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  let mutationPayload: any = null;
  let upsertConflictKey = 'id';
  let singleMode: 'none' | 'single' | 'maybeSingle' = 'none';
  let limitCount: number | null = null;
  let rangeConfig: { from: number; to: number } | null = null;
  let orderConfig: { column: string; ascending: boolean } | null = null;
  const predicates: Array<(row: RowRecord) => boolean> = [];

  const execute = () => {
    const currentRows = tableStore[tableName] || [];

    if (operation === 'insert') {
      const items = Array.isArray(mutationPayload) ? mutationPayload : [mutationPayload];
      const inserted = items.map((item, idx) => ({
        id: item?.id || `mock-${tableName}-${currentRows.length + idx + 1}`,
        created_at: item?.created_at || '2026-01-01T00:00:00.000Z',
        ...item,
      }));
      tableStore[tableName] = [...currentRows, ...inserted];
      const resultData =
        singleMode !== 'none' ? inserted[0] ?? null : inserted;
      return { data: resultData, error: null, count: inserted.length };
    }

    if (operation === 'upsert') {
      const items = Array.isArray(mutationPayload) ? mutationPayload : [mutationPayload];
      const nextRows = [...currentRows];
      const upserted: RowRecord[] = [];

      for (const item of items) {
        const keyVal = item?.[upsertConflictKey];
        const existingIdx =
          keyVal !== undefined
            ? nextRows.findIndex((r) => r[upsertConflictKey] === keyVal)
            : -1;

        if (existingIdx >= 0) {
          const merged = { ...nextRows[existingIdx], ...item };
          nextRows[existingIdx] = merged;
          upserted.push(merged);
        } else {
          const created = {
            id: item?.id || `mock-${tableName}-${nextRows.length + 1}`,
            created_at: item?.created_at || '2026-01-01T00:00:00.000Z',
            ...item,
          };
          nextRows.push(created);
          upserted.push(created);
        }
      }

      tableStore[tableName] = nextRows;
      const resultData =
        singleMode !== 'none' ? upserted[0] ?? null : upserted;
      return { data: resultData, error: null, count: upserted.length };
    }

    const matchesPredicates = (row: RowRecord) =>
      predicates.every((fn) => fn(row));

    if (operation === 'update') {
      const updatedRows: RowRecord[] = [];
      tableStore[tableName] = currentRows.map((row) => {
        if (matchesPredicates(row)) {
          const updated = { ...row, ...mutationPayload };
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });
      const resultData =
        singleMode !== 'none' ? updatedRows[0] ?? null : updatedRows;
      return { data: resultData, error: null, count: updatedRows.length };
    }

    if (operation === 'delete') {
      const deletedRows: RowRecord[] = [];
      tableStore[tableName] = currentRows.filter((row) => {
        if (matchesPredicates(row)) {
          deletedRows.push(row);
          return false;
        }
        return true;
      });
      const resultData =
        singleMode !== 'none' ? deletedRows[0] ?? null : deletedRows;
      return { data: resultData, error: null, count: deletedRows.length };
    }

    // Default: 'select'
    let filtered = currentRows.filter(matchesPredicates).map((r) => ({ ...r }));

    if (orderConfig) {
      const { column, ascending } = orderConfig;
      filtered.sort((a, b) => {
        if (a[column] === b[column]) return 0;
        const cmp = a[column] > b[column] ? 1 : -1;
        return ascending ? cmp : -cmp;
      });
    }

    if (rangeConfig) {
      filtered = filtered.slice(rangeConfig.from, rangeConfig.to + 1);
    } else if (limitCount !== null) {
      filtered = filtered.slice(0, limitCount);
    }

    if (singleMode === 'single') {
      if (filtered.length === 0) {
        return {
          data: null,
          error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' },
          count: 0,
        };
      }
      return { data: filtered[0], error: null, count: 1 };
    }

    if (singleMode === 'maybeSingle') {
      return { data: filtered[0] ?? null, error: null, count: filtered.length };
    }

    return { data: filtered, error: null, count: filtered.length };
  };

  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn((payload: any) => {
      operation = 'insert';
      mutationPayload = payload;
      return builder;
    }),
    upsert: vi.fn((payload: any, options?: { onConflict?: string }) => {
      operation = 'upsert';
      mutationPayload = payload;
      if (options?.onConflict) {
        upsertConflictKey = options.onConflict.split(',')[0].trim();
      }
      return builder;
    }),
    update: vi.fn((payload: any) => {
      operation = 'update';
      mutationPayload = payload;
      return builder;
    }),
    delete: vi.fn(() => {
      operation = 'delete';
      return builder;
    }),
    eq: vi.fn((column: string, value: any) => {
      predicates.push((row) => row[column] === value);
      return builder;
    }),
    neq: vi.fn((column: string, value: any) => {
      predicates.push((row) => row[column] !== value);
      return builder;
    }),
    in: vi.fn((column: string, values: any[]) => {
      const set = new Set(Array.isArray(values) ? values : []);
      predicates.push((row) => set.has(row[column]));
      return builder;
    }),
    ilike: vi.fn((column: string, pattern: string) => {
      const needle = String(pattern || '').replace(/%/g, '').toLowerCase();
      predicates.push((row) =>
        String(row[column] ?? '').toLowerCase().includes(needle)
      );
      return builder;
    }),
    or: vi.fn((expr: string) => {
      if (typeof expr === 'string' && expr.includes('.ilike.')) {
        const clauses = expr.split(',').map((c) => c.trim()).filter(Boolean);
        predicates.push((row) =>
          clauses.some((clause) => {
            const parts = clause.split('.ilike.');
            if (parts.length !== 2) return true;
            const col = parts[0].trim();
            const needle = parts[1].replace(/%/g, '').toLowerCase();
            return String(row[col] ?? '').toLowerCase().includes(needle);
          })
        );
      }
      return builder;
    }),
    order: vi.fn((column: string, opts?: { ascending?: boolean }) => {
      orderConfig = { column, ascending: opts?.ascending ?? true };
      return builder;
    }),
    limit: vi.fn((count: number) => {
      limitCount = count;
      return builder;
    }),
    range: vi.fn((fromIdx: number, toIdx: number) => {
      rangeConfig = { from: Math.max(0, fromIdx), to: Math.max(fromIdx, toIdx) };
      return builder;
    }),
    single: vi.fn(() => {
      singleMode = 'single';
      return Promise.resolve(execute());
    }),
    maybeSingle: vi.fn(() => {
      singleMode = 'maybeSingle';
      return Promise.resolve(execute());
    }),
    then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
      return Promise.resolve(execute()).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

function createStorageBucketMock(bucketName: string) {
  return {
    upload: vi.fn(async (filePath: string) => ({
      data: { path: filePath, fullPath: `${bucketName}/${filePath}` },
      error: null,
    })),
    update: vi.fn(async (filePath: string) => ({
      data: { path: filePath, fullPath: `${bucketName}/${filePath}` },
      error: null,
    })),
    uploadToSignedUrl: vi.fn(async (filePath: string) => ({
      data: { path: filePath, fullPath: `${bucketName}/${filePath}` },
      error: null,
    })),
    getPublicUrl: vi.fn((filePath: string) => ({
      data: {
        publicUrl: `${DEFAULT_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`,
      },
    })),
    remove: vi.fn(async (paths: string[]) => ({
      data: paths.map((p) => ({ name: p })),
      error: null,
    })),
    list: vi.fn(async () => ({
      data: [],
      error: null,
    })),
  };
}

export const mockSupabaseClient: any = {
  from: vi.fn((tableName: string) => createQueryBuilder(tableName)),
  rpc: vi.fn(async () => ({ data: null, error: null })),
  auth: {
    getSession: vi.fn(async () => ({
      data: { session: mockSession },
      error: null,
    })),
    getUser: vi.fn(async () => ({
      data: { user: mockSession?.user ?? null },
      error: null,
    })),
    refreshSession: vi.fn(async () => ({
      data: { session: mockSession, user: mockSession?.user ?? null },
      error: null,
    })),
    setSession: vi.fn(async (tokens: { access_token: string; refresh_token: string }) => {
      if (mockSession) {
        mockSession = { ...mockSession, ...tokens };
      }
      return { data: { session: mockSession, user: mockSession?.user ?? null }, error: null };
    }),
    signInWithPassword: vi.fn(async ({ email }: { email: string; password?: string }) => ({
      data: {
        session: mockSession,
        user: { ...(mockSession?.user || {}), email },
      },
      error: null,
    })),
    signUp: vi.fn(async ({ email }: { email: string; password?: string }) => ({
      data: {
        session: mockSession,
        user: {
          id: '00000000-0000-4000-8000-000000000002',
          email,
          role: 'authenticated',
        },
      },
      error: null,
    })),
    signOut: vi.fn(async () => {
      mockSession = null;
      return { error: null };
    }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  storage: {
    from: vi.fn((bucketName: string) => createStorageBucketMock(bucketName)),
  },
  channel: vi.fn((channelName: string) => {
    const ch: any = {
      topic: channelName,
      on: vi.fn(() => ch),
      subscribe: vi.fn((cb?: (status: string) => void) => {
        cb?.('SUBSCRIBED');
        return ch;
      }),
      unsubscribe: vi.fn(async () => 'ok'),
    };
    return ch;
  }),
  removeChannel: vi.fn(async () => 'ok'),
};

export const supabase = mockSupabaseClient;
export const rawClient = mockSupabaseClient;
export const setQueryBuilderWrapper = vi.fn();
export const getActivePortalType = vi.fn((): 'band' | 'promoter' | 'creative' => 'band');
export const getSupabaseUrlForPortal = vi.fn(() => DEFAULT_SUPABASE_URL);
export const getSupabaseAnonKeyForPortal = vi.fn(() => DEFAULT_SUPABASE_ANON_KEY);
export const getSupabaseUrl = vi.fn(() => DEFAULT_SUPABASE_URL);
export const getSupabaseAnonKey = vi.fn(() => DEFAULT_SUPABASE_ANON_KEY);
export const clearSupabaseClientsCache = vi.fn();
export const getRawSupabase = vi.fn(() => mockSupabaseClient);
export const getSupabase = vi.fn(() => mockSupabaseClient);
export const ensureValidSupabaseAuthSession = vi.fn(async () => mockSession);

export default mockSupabaseClient;
