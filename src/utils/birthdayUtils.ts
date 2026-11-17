export interface BirthdayMonthOption {
  value: number;
  label: string;
  shortLabel: string;
  maxDays: number;
}

export const BIRTHDAY_MONTHS: BirthdayMonthOption[] = [
  { value: 1, label: 'January', shortLabel: 'Jan', maxDays: 31 },
  { value: 2, label: 'February', shortLabel: 'Feb', maxDays: 29 },
  { value: 3, label: 'March', shortLabel: 'Mar', maxDays: 31 },
  { value: 4, label: 'April', shortLabel: 'Apr', maxDays: 30 },
  { value: 5, label: 'May', shortLabel: 'May', maxDays: 31 },
  { value: 6, label: 'June', shortLabel: 'Jun', maxDays: 30 },
  { value: 7, label: 'July', shortLabel: 'Jul', maxDays: 31 },
  { value: 8, label: 'August', shortLabel: 'Aug', maxDays: 31 },
  { value: 9, label: 'September', shortLabel: 'Sep', maxDays: 30 },
  { value: 10, label: 'October', shortLabel: 'Oct', maxDays: 31 },
  { value: 11, label: 'November', shortLabel: 'Nov', maxDays: 30 },
  { value: 12, label: 'December', shortLabel: 'Dec', maxDays: 31 },
];

export interface BirthdayPreferences {
  birthday_month: number | null;
  birthday_day: number | null;
  show_birthday_shoutout: boolean;
}

export const BIRTHDAY_UPDATED_EVENT = 'nexus_birthday_updated';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function getDefaultStorage(customStorage?: StorageLike): StorageLike | null {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getDaysInBirthdayMonth(month?: number | null): number {
  const m = normalizeBirthdayMonth(month);
  if (!m) return 31;
  return BIRTHDAY_MONTHS[m - 1]?.maxDays || 31;
}

export function normalizeBirthdayMonth(month: unknown): number | null {
  if (month === null || month === undefined || month === '') return null;
  const num = Number(month);
  if (!Number.isInteger(num) || num < 1 || num > 12) return null;
  return num;
}

export function normalizeBirthdayDay(day: unknown, month?: unknown): number | null {
  if (day === null || day === undefined || day === '') return null;
  const num = Number(day);
  if (!Number.isInteger(num) || num < 1 || num > 31) return null;
  const normMonth = normalizeBirthdayMonth(month);
  if (normMonth !== null) {
    const maxDays = getDaysInBirthdayMonth(normMonth);
    if (num > maxDays) return null;
  }
  return num;
}

export function clampBirthdayDay(month: unknown, day: unknown): number | null {
  if (day === null || day === undefined || day === '') return null;
  const num = Number(day);
  if (!Number.isInteger(num) || num < 1) return null;
  const maxDays = getDaysInBirthdayMonth(normalizeBirthdayMonth(month));
  return Math.min(num, maxDays);
}

export function hasValidBirthday(profileOrMonth: any, maybeDay?: unknown): boolean {
  if (typeof profileOrMonth === 'number' || typeof profileOrMonth === 'string') {
    const month = normalizeBirthdayMonth(profileOrMonth);
    if (month === null) return false;
    const day = normalizeBirthdayDay(maybeDay, month);
    return day !== null;
  }
  if (!profileOrMonth || typeof profileOrMonth !== 'object') return false;
  const month = normalizeBirthdayMonth(profileOrMonth.birthday_month);
  if (month === null) return false;
  const day = normalizeBirthdayDay(profileOrMonth.birthday_day, month);
  return day !== null;
}

export function formatBirthdayMonthDay(month?: number | null, day?: number | null): string | null {
  const m = normalizeBirthdayMonth(month);
  const d = normalizeBirthdayDay(day, m);
  if (!m || !d) return null;
  const monthObj = BIRTHDAY_MONTHS[m - 1];
  return `${monthObj ? monthObj.label : `Month ${m}`} ${d}`;
}

export function isBirthdayToday(
  profileOrPrefs: any,
  now: Date = new Date(),
  customStorage?: StorageLike
): boolean {
  const effective = resolveEffectiveBirthdayProfile(profileOrPrefs, undefined, customStorage);
  if (!hasValidBirthday(effective)) return false;
  const month = normalizeBirthdayMonth(effective.birthday_month);
  const day = normalizeBirthdayDay(effective.birthday_day, month);
  if (!month || !day) return false;
  return month === now.getMonth() + 1 && day === now.getDate();
}

export function shouldShowBirthdayShoutout(
  profileOrPrefs: any,
  now: Date = new Date(),
  customStorage?: StorageLike
): boolean {
  const effective = resolveEffectiveBirthdayProfile(profileOrPrefs, undefined, customStorage);
  if (!isBirthdayToday(effective, now, customStorage)) return false;
  if (profileOrPrefs?.show_birthday_shoutout === false || effective.show_birthday_shoutout === false) {
    return false;
  }
  return true;
}

export function resolveBirthdayUserKey(userProfile?: any): string {
  if (typeof userProfile === 'string') {
    const clean = userProfile.trim().toLowerCase();
    return clean || 'guest';
  }
  const raw = String(
    userProfile?.id ||
      userProfile?.email ||
      userProfile?.console_handle ||
      userProfile?.handle ||
      userProfile?.username ||
      'guest'
  )
    .trim()
    .toLowerCase();
  return raw || 'guest';
}

export function extractCandidateBirthdayKeys(userKeyOrProfile?: any): string[] {
  const keys = new Set<string>();
  if (!userKeyOrProfile) {
    keys.add('guest');
    return Array.from(keys);
  }
  if (typeof userKeyOrProfile === 'string') {
    const clean = userKeyOrProfile.trim().toLowerCase();
    if (clean) keys.add(clean);
    const noAt = clean.replace(/^@+/, '');
    if (noAt) keys.add(noAt);
    return keys.size > 0 ? Array.from(keys) : ['guest'];
  }
  if (typeof userKeyOrProfile === 'object') {
    const candidates = [
      userKeyOrProfile.id,
      userKeyOrProfile.user_id,
      userKeyOrProfile.email,
      userKeyOrProfile.console_handle,
      userKeyOrProfile.handle,
      userKeyOrProfile.username,
      userKeyOrProfile.name,
    ];
    for (const c of candidates) {
      if (c !== undefined && c !== null) {
        const clean = String(c).trim().toLowerCase();
        if (clean && clean !== 'undefined' && clean !== 'null') {
          keys.add(clean);
          const noAt = clean.replace(/^@+/, '');
          if (noAt) keys.add(noAt);
        }
      }
    }
  }
  if (keys.size === 0) keys.add('guest');
  return Array.from(keys);
}

export function getBirthdayPrefsStorageKey(userKey: string): string {
  const normalized = String(userKey || 'guest').trim().toLowerCase() || 'guest';
  return `nexus_birthday_prefs_${normalized}`;
}

export function loadBirthdayPrefsFromStorage(
  userKeyOrProfile: any = 'guest',
  customStorage?: StorageLike
): BirthdayPreferences {
  const fallback: BirthdayPreferences = {
    birthday_month: null,
    birthday_day: null,
    show_birthday_shoutout: true,
  };
  const storage = getDefaultStorage(customStorage);
  if (!storage) return fallback;

  const candidateKeys = extractCandidateBirthdayKeys(userKeyOrProfile);
  let fallbackCandidate: BirthdayPreferences | null = null;

  for (const key of candidateKeys) {
    try {
      const raw = storage.getItem(getBirthdayPrefsStorageKey(key));
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const month = normalizeBirthdayMonth(parsed?.birthday_month);
      const day = normalizeBirthdayDay(parsed?.birthday_day, month);
      const prefs: BirthdayPreferences = {
        birthday_month: month,
        birthday_day: day,
        show_birthday_shoutout: parsed?.show_birthday_shoutout !== false,
      };
      if (month !== null && day !== null) {
        return prefs;
      }
      if (!fallbackCandidate) {
        fallbackCandidate = prefs;
      }
    } catch {
      // continue checking next key
    }
  }

  // Also check nexus_core_user_profile if it belongs to the same user or if checking active user
  try {
    const coreRaw = storage.getItem('nexus_core_user_profile');
    if (coreRaw && coreRaw !== 'null') {
      const coreParsed = JSON.parse(coreRaw);
      if (coreParsed && typeof coreParsed === 'object') {
        const coreKeys = extractCandidateBirthdayKeys(coreParsed);
        const isMatchingUser =
          candidateKeys.includes('guest') ||
          candidateKeys.includes('active_user') ||
          candidateKeys.some((k) => coreKeys.includes(k));
        if (isMatchingUser) {
          const month = normalizeBirthdayMonth(
            coreParsed.birthday_month ??
              coreParsed.promoter_metadata?.birthday_month ??
              coreParsed.band_metadata?.birthday_month
          );
          const day = normalizeBirthdayDay(
            coreParsed.birthday_day ??
              coreParsed.promoter_metadata?.birthday_day ??
              coreParsed.band_metadata?.birthday_day,
            month
          );
          if (month !== null && day !== null) {
            return {
              birthday_month: month,
              birthday_day: day,
              show_birthday_shoutout:
                coreParsed.show_birthday_shoutout !== undefined
                  ? coreParsed.show_birthday_shoutout !== false
                  : true,
            };
          }
        }
      }
    }
  } catch {
    // ignore parse errors
  }

  return fallbackCandidate || fallback;
}

export function saveBirthdayPrefsToStorage(
  userKeyOrProfile: any,
  prefs: Partial<BirthdayPreferences>,
  customStorage?: StorageLike
): BirthdayPreferences {
  const storage = getDefaultStorage(customStorage);
  const primaryKey = resolveBirthdayUserKey(userKeyOrProfile);
  const current = loadBirthdayPrefsFromStorage(userKeyOrProfile, customStorage);
  const nextMonth =
    prefs.birthday_month !== undefined
      ? normalizeBirthdayMonth(prefs.birthday_month)
      : current.birthday_month;
  const rawDay =
    prefs.birthday_day !== undefined ? prefs.birthday_day : current.birthday_day;
  const nextDay =
    nextMonth !== null ? clampBirthdayDay(nextMonth, rawDay) : normalizeBirthdayDay(rawDay);
  const nextShow =
    prefs.show_birthday_shoutout !== undefined
      ? Boolean(prefs.show_birthday_shoutout)
      : current.show_birthday_shoutout;

  const merged: BirthdayPreferences = {
    birthday_month: nextMonth,
    birthday_day: nextDay,
    show_birthday_shoutout: nextShow,
  };

  if (storage) {
    const candidateKeys = extractCandidateBirthdayKeys(userKeyOrProfile);
    for (const key of candidateKeys) {
      try {
        storage.setItem(getBirthdayPrefsStorageKey(key), JSON.stringify(merged));
      } catch {
        // ignore storage errors
      }
    }

    // Also sync into nexus_core_user_profile if it matches this user so reloads/merges never lose it
    try {
      const coreRaw = storage.getItem('nexus_core_user_profile');
      if (coreRaw && coreRaw !== 'null') {
        const coreParsed = JSON.parse(coreRaw);
        if (coreParsed && typeof coreParsed === 'object') {
          const coreKeys = extractCandidateBirthdayKeys(coreParsed);
          const isMatchingUser =
            candidateKeys.includes('guest') ||
            candidateKeys.includes('active_user') ||
            candidateKeys.some((k) => coreKeys.includes(k));
          if (isMatchingUser) {
            for (const cKey of coreKeys) {
              try {
                storage.setItem(getBirthdayPrefsStorageKey(cKey), JSON.stringify(merged));
              } catch {
                // ignore
              }
            }
            const updatedCore = {
              ...coreParsed,
              birthday_month: merged.birthday_month,
              birthday_day: merged.birthday_day,
              show_birthday_shoutout: merged.show_birthday_shoutout,
              ...(coreParsed.promoter_metadata && typeof coreParsed.promoter_metadata === 'object'
                ? {
                    promoter_metadata: {
                      ...coreParsed.promoter_metadata,
                      birthday_month: merged.birthday_month,
                      birthday_day: merged.birthday_day,
                      show_birthday_shoutout: merged.show_birthday_shoutout,
                    },
                  }
                : {}),
              ...(coreParsed.band_metadata && typeof coreParsed.band_metadata === 'object'
                ? {
                    band_metadata: {
                      ...coreParsed.band_metadata,
                      birthday_month: merged.birthday_month,
                      birthday_day: merged.birthday_day,
                      show_birthday_shoutout: merged.show_birthday_shoutout,
                    },
                  }
                : {}),
            };
            storage.setItem('nexus_core_user_profile', JSON.stringify(updatedCore));
          }
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  if (typeof window !== 'undefined' && !customStorage) {
    window.dispatchEvent(
      new CustomEvent(BIRTHDAY_UPDATED_EVENT, {
        detail: { userKey: primaryKey, prefs: merged },
      })
    );
    window.dispatchEvent(
      new CustomEvent('nexus_onboarding_checklist_updated', {
        detail: { userKey: primaryKey, source: 'birthday' },
      })
    );
  }

  return merged;
}

export function resolveEffectiveBirthdayProfile(
  profile: any,
  currentUserProfile?: any,
  customStorage?: StorageLike
): BirthdayPreferences {
  const month = normalizeBirthdayMonth(
    profile?.birthday_month ??
      profile?.promoter_metadata?.birthday_month ??
      profile?.band_metadata?.birthday_month
  );
  const day = normalizeBirthdayDay(
    profile?.birthday_day ??
      profile?.promoter_metadata?.birthday_day ??
      profile?.band_metadata?.birthday_day,
    month
  );
  const hasExplicitShow = typeof profile?.show_birthday_shoutout === 'boolean';

  if (month !== null && day !== null) {
    return {
      birthday_month: month,
      birthday_day: day,
      show_birthday_shoutout: hasExplicitShow ? Boolean(profile.show_birthday_shoutout) : true,
    };
  }

  const stored = loadBirthdayPrefsFromStorage(profile || currentUserProfile, customStorage);
  if (hasValidBirthday(stored)) {
    return {
      birthday_month: stored.birthday_month,
      birthday_day: stored.birthday_day,
      show_birthday_shoutout: hasExplicitShow
        ? Boolean(profile.show_birthday_shoutout)
        : stored.show_birthday_shoutout,
    };
  }

  if (currentUserProfile && profile && (profile.isYou || (profile.id && profile.id === currentUserProfile.id))) {
    const cuMonth = normalizeBirthdayMonth(currentUserProfile.birthday_month);
    const cuDay = normalizeBirthdayDay(currentUserProfile.birthday_day, cuMonth);
    if (cuMonth !== null && cuDay !== null) {
      return {
        birthday_month: cuMonth,
        birthday_day: cuDay,
        show_birthday_shoutout: currentUserProfile.show_birthday_shoutout !== false,
      };
    }
    const cuStored = loadBirthdayPrefsFromStorage(currentUserProfile, customStorage);
    if (hasValidBirthday(cuStored)) {
      return cuStored;
    }
  }

  return {
    birthday_month: month,
    birthday_day: day,
    show_birthday_shoutout: hasExplicitShow ? Boolean(profile.show_birthday_shoutout) : true,
  };
}

export function buildBirthdayHornsMessage(recipientName?: string): string {
  const cleanName = String(recipientName || '')
    .replace(/^@+/, '')
    .trim();
  if (cleanName && cleanName.toLowerCase() !== 'user' && cleanName.toLowerCase() !== 'scene member') {
    return `🤘 Happy Birthday ${cleanName}! Sending Birthday Horns 🤘🎂🔥`;
  }
  return '🤘 Happy Birthday! Sending Birthday Horns 🤘🎂🔥';
}

export function isMutualConnection(
  targetProfile: any,
  currentUserProfile?: any,
  customStorage?: StorageLike
): boolean {
  if (!targetProfile || typeof targetProfile !== 'object') return false;
  if (targetProfile.isYou) return false;

  const targetId = String(targetProfile.id || targetProfile.user_id || '').trim().toLowerCase();
  const selfId = String(currentUserProfile?.id || '').trim().toLowerCase();
  if (targetId && selfId && targetId === selfId) return false;

  if (
    targetProfile.isMutual === true ||
    targetProfile.is_mutual === true ||
    targetProfile.followedBack === true ||
    targetProfile.followed_back === true ||
    targetProfile.mutual === true
  ) {
    return true;
  }

  const isFollowingTarget = Boolean(
    targetProfile.isFollowed === true ||
      targetProfile.is_followed === true ||
      targetProfile.isFollowing === true
  );
  const targetFollowsMe = Boolean(
    targetProfile.followsMe === true ||
      targetProfile.follows_me === true ||
      targetProfile.followsYou === true ||
      targetProfile.follows_you === true
  );
  if (isFollowingTarget && targetFollowsMe) {
    return true;
  }

  if (Array.isArray(currentUserProfile?.following) && targetId) {
    const followsTargetInList = currentUserProfile.following.some(
      (id: any) => String(id || '').trim().toLowerCase() === targetId
    );
    if (followsTargetInList) return true;
  }

  const targetHandle = String(
    targetProfile.console_handle || targetProfile.handle || targetProfile.username || ''
  )
    .replace(/^@+/, '')
    .trim()
    .toLowerCase();
  const targetName = String(targetProfile.full_name || targetProfile.name || '')
    .trim()
    .toLowerCase();

  const storage = getDefaultStorage(customStorage);
  if (storage) {
    try {
      const rawMutuals = storage.getItem('nexus_local_mutuals_v1');
      if (rawMutuals) {
        const parsed = JSON.parse(rawMutuals);
        if (Array.isArray(parsed)) {
          const matched = parsed.some((entry: any) => {
            if (!entry) return false;
            if (typeof entry === 'string') {
              const eStr = entry.replace(/^@+/, '').trim().toLowerCase();
              return Boolean((targetId && eStr === targetId) || (targetHandle && eStr === targetHandle));
            }
            const eId = String(entry.id || entry.user_id || '').trim().toLowerCase();
            const eHandle = String(entry.console_handle || entry.handle || entry.username || '')
              .replace(/^@+/, '')
              .trim()
              .toLowerCase();
            const eName = String(entry.full_name || entry.name || '').trim().toLowerCase();
            return Boolean(
              (targetId && eId && eId === targetId) ||
                (targetHandle && eHandle && eHandle === targetHandle) ||
                (targetName && eName && eName === targetName)
            );
          });
          if (matched) return true;
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  return false;
}
