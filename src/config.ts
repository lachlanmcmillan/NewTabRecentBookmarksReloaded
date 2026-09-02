/** User settings persisted in extension storage. */
export type Config = {
  recentBookmarksReversed: boolean;
  bookmarkFoldersReversed: boolean;
  /** How many bookmarks to show in the "Recent" group. */
  recentBookmarksCount: number;
};

export const configDefaults: Config = {
  recentBookmarksReversed: true,
  bookmarkFoldersReversed: false,
  recentBookmarksCount: 36,
};

export const RECENT_BOOKMARKS_MIN = 1;
export const RECENT_BOOKMARKS_MAX = 200;

/** Clamp a recent-bookmark count to the supported range, falling back to the default. */
export function clampRecentBookmarksCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return configDefaults.recentBookmarksCount;
  return Math.min(
    RECENT_BOOKMARKS_MAX,
    Math.max(RECENT_BOOKMARKS_MIN, Math.round(n))
  );
}

/** Coerce values read from storage into a well-formed Config. */
export function normalizeConfig(raw: Partial<Config>): Config {
  return {
    recentBookmarksReversed: Boolean(
      raw.recentBookmarksReversed ?? configDefaults.recentBookmarksReversed
    ),
    bookmarkFoldersReversed: Boolean(
      raw.bookmarkFoldersReversed ?? configDefaults.bookmarkFoldersReversed
    ),
    recentBookmarksCount: clampRecentBookmarksCount(
      raw.recentBookmarksCount ?? configDefaults.recentBookmarksCount
    ),
  };
}
