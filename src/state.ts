import { configDefaults, type Config } from './config';
import { browserAPI } from './browser-adapter';

// Module-level copies of the app state that the drag handlers need.
// App.tsx keeps these in sync as its own state changes.
export let config: Config = { ...configDefaults };
export let pinnedFolders: string[] = [];

export function updateConfig(c: Config): void {
  config = c;
}

export function updatePinnedFolders(pf: string[]): void {
  pinnedFolders = pf;
}

/** The search and recent columns are virtual; only pinned folders can be edited. */
export function canModifyGroup(groupId: string): boolean {
  return groupId !== 'search' && groupId !== 'recent';
}

function setPinnedFolders(newPinnedFolders: string[]): void {
  browserAPI.storage.local.set({ pinnedFolders: newPinnedFolders });
}

function movePinnedFolder(
  bookmarkId: string,
  bookmarkIndex: number,
  newIndex: number
): void {
  newIndex = Math.max(0, Math.min(newIndex, pinnedFolders.length - 1));
  if (newIndex !== bookmarkIndex) {
    const newArr = pinnedFolders.slice();
    newArr.splice(bookmarkIndex, 1);
    newArr.splice(newIndex, 0, bookmarkId);
    setPinnedFolders(newArr);
  }
}

export function insertBeforePinnedFolder(
  bookmarkId: string,
  targetBookmarkId: string
): void {
  const bookmarkIndex = pinnedFolders.indexOf(bookmarkId);
  const targetIndex = pinnedFolders.indexOf(targetBookmarkId);
  if (bookmarkIndex === -1 || targetIndex === -1) return;
  let newIndex = targetIndex;
  if (bookmarkIndex < newIndex) newIndex -= 1;
  movePinnedFolder(bookmarkId, bookmarkIndex, newIndex);
}
