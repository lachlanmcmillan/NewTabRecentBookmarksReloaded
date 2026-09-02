import { configDefaults } from './config.js';
import { browserAPI } from './browser-adapter.js';

export var config = { ...configDefaults };
export var pinnedFolders = [];

export function updateConfig(c) {
  config = c;
}

export function updatePinnedFolders(pf) {
  pinnedFolders = pf;
}

export function canModifyGroup(groupId) {
  return groupId !== 'search' && groupId !== 'recent';
}

function setPinnedFolders(newPinnedFolders) {
  browserAPI.storage.local.set({ pinnedFolders: newPinnedFolders });
}

function movePinnedFolder(bookmarkId, bookmarkIndex, newIndex) {
  newIndex = Math.max(0, Math.min(newIndex, pinnedFolders.length - 1));
  if (newIndex !== bookmarkIndex) {
    var newArr = pinnedFolders.slice();
    newArr.splice(bookmarkIndex, 1);
    newArr.splice(newIndex, 0, bookmarkId);
    setPinnedFolders(newArr);
  }
}

export function insertBeforePinnedFolder(bookmarkId, targetBookmarkId) {
  var bookmarkIndex = pinnedFolders.indexOf(bookmarkId);
  var targetIndex = pinnedFolders.indexOf(targetBookmarkId);
  if (bookmarkIndex === -1 || targetIndex === -1) return;
  var newIndex = targetIndex;
  if (bookmarkIndex < newIndex) newIndex -= 1;
  movePinnedFolder(bookmarkId, bookmarkIndex, newIndex);
}
