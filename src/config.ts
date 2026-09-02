/** User settings persisted in extension storage. */
export type Config = {
  recentBookmarksReversed: boolean;
  bookmarkFoldersReversed: boolean;
};

export const configDefaults: Config = {
  recentBookmarksReversed: true,
  bookmarkFoldersReversed: false,
};
