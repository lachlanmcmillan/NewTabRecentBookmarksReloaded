// Unified browser API adapter.
// Wraps the callback-based Chrome/Firefox extension APIs so every method
// returns a Promise, and adds cross-browser helpers for bookmark type
// detection and favicon URLs.

export const isFirefox = typeof browser !== 'undefined';
export const isChrome = !isFirefox;

/** A bookmark or folder node. Chrome omits `type`; Firefox sets it. */
export type Bookmark = browser.bookmarks.BookmarkTreeNode;

export type StorageChange = { oldValue?: unknown; newValue?: unknown };
export type StorageChanges = Record<string, StorageChange>;

type Listener<T extends unknown[]> = (...args: T) => void;
interface EventSource<T extends unknown[]> {
  addListener(listener: Listener<T>): void;
  removeListener(listener: Listener<T>): void;
}

export interface BrowserAPI {
  bookmarks: {
    get(idOrIds: string | string[]): Promise<Bookmark[]>;
    getChildren(id: string): Promise<Bookmark[]>;
    getRecent(count: number): Promise<Bookmark[]>;
    getTree(): Promise<Bookmark[]>;
    search(
      query: string | { query?: string; url?: string; title?: string }
    ): Promise<Bookmark[]>;
    update(
      id: string,
      changes: { title?: string; url?: string }
    ): Promise<Bookmark>;
    move(
      id: string,
      destination: { parentId?: string; index?: number }
    ): Promise<Bookmark>;
    remove(id: string): Promise<void>;
    onCreated: EventSource<[id: string, bookmark: Bookmark]>;
    onRemoved: EventSource<[id: string, removeInfo: unknown]>;
    onMoved: EventSource<[id: string, moveInfo: unknown]>;
  };
  storage: {
    local: {
      /** Returns the stored values for the keys in `defaults`, falling back to the given defaults. */
      get<T extends object>(defaults: T): Promise<T>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
    };
    onChanged: EventSource<[changes: StorageChanges, areaName: string]>;
  };
  runtime: {
    openOptionsPage(): Promise<void>;
    getURL(path: string): string;
  };
  /** Firefox only. */
  theme?: {
    getCurrent(): Promise<unknown>;
  };
}

type AnyFn = (...args: any[]) => any;

/** Wraps a callback-style API method so it returns a Promise instead. */
function promisify(
  fn: AnyFn,
  context: unknown
): (...args: unknown[]) => Promise<any> {
  return function (...args: unknown[]) {
    return new Promise(function (resolve, reject) {
      fn.apply(context, [
        ...args,
        function (result: unknown) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        },
      ]);
    });
  };
}

export const browserAPI: BrowserAPI = (function () {
  const api = chrome;

  const adapter: BrowserAPI = {
    bookmarks: {
      get: promisify(api.bookmarks.get, api.bookmarks),
      getChildren: promisify(api.bookmarks.getChildren, api.bookmarks),
      getRecent: promisify(api.bookmarks.getRecent, api.bookmarks),
      getTree: promisify(api.bookmarks.getTree, api.bookmarks),
      search: promisify(api.bookmarks.search, api.bookmarks),
      update: promisify(api.bookmarks.update, api.bookmarks),
      move: promisify(api.bookmarks.move, api.bookmarks),
      remove: promisify(api.bookmarks.remove, api.bookmarks),
      onCreated: api.bookmarks
        .onCreated as unknown as BrowserAPI['bookmarks']['onCreated'],
      onRemoved: api.bookmarks
        .onRemoved as unknown as BrowserAPI['bookmarks']['onRemoved'],
      onMoved: api.bookmarks
        .onMoved as unknown as BrowserAPI['bookmarks']['onMoved'],
    },
    storage: {
      local: {
        get: promisify(api.storage.local.get, api.storage.local),
        set: promisify(api.storage.local.set, api.storage.local),
        remove: promisify(api.storage.local.remove, api.storage.local),
      },
      onChanged: api.storage
        .onChanged as unknown as BrowserAPI['storage']['onChanged'],
    },
    runtime: {
      openOptionsPage: promisify(api.runtime.openOptionsPage, api.runtime),
      getURL: api.runtime.getURL.bind(api.runtime),
    },
  };

  if (isFirefox && typeof browser.theme !== 'undefined') {
    adapter.theme = {
      getCurrent: () => browser.theme.getCurrent(),
    };
  }

  return adapter;
})();

// Chrome does not set bookmark.type, Firefox does.
export function detectBookmark(bookmark: Bookmark): boolean {
  return typeof bookmark.type !== 'undefined'
    ? bookmark.type === 'bookmark'
    : typeof bookmark.dateGroupModified === 'undefined';
}

export function detectFolder(bookmark: Bookmark): boolean {
  return typeof bookmark.type !== 'undefined'
    ? bookmark.type === 'folder'
    : typeof bookmark.dateGroupModified !== 'undefined';
}

/**
 * Chrome exposes its favicon cache through a built-in URL. Firefox does not,
 * so the favicon cacher background script stores icons instead and this
 * returns null.
 */
export function getFaviconURL(url: string): string | null {
  if (!isChrome) {
    return null;
  }
  const faviconUrl = new URL(browserAPI.runtime.getURL('/_favicon/'));
  faviconUrl.searchParams.set('pageUrl', url);
  faviconUrl.searchParams.set('size', '32');
  return faviconUrl.toString();
}
