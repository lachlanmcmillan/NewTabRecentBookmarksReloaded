import { Component } from 'preact';
import {
  browserAPI,
  isChrome,
  type Bookmark,
  type StorageChanges,
} from '../../browser-adapter';
import { configDefaults, normalizeConfig, type Config } from '../../config';
import { updateConfig, updatePinnedFolders } from '../../state';
import { KanbanGroup } from '../KanbanGroup/KanbanGroup';
import { EditBookmarkModal } from '../EditBookmarkModal/EditBookmarkModal';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { SearchBar, SEARCH_INPUT_ID } from '../SearchBar/SearchBar';
import styles from './app.module.css';

interface FolderGroup {
  title: string;
  bookmarks: Bookmark[];
}

interface AppState {
  config: Config;
  pinnedFolders: string[];
  recentBookmarks: Bookmark[];
  folderGroups: Record<string, FolderGroup>;
  /** null when not searching. */
  searchResults: Bookmark[] | null;
  /** Cached favicon URL per hostname (Firefox only). */
  favicons: Record<string, string>;
  editingBookmarkId: string | null;
  settingsOpen: boolean;
  pageLoaded: boolean;
}

const SEARCH_DEBOUNCE_MS = 600;

function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  wait: number
): (...args: A) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function (...args: A) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/** GitHub's favicon is a dark glyph on transparent; flip it for dark mode. */
function fixDarkFavIcon(hostname: string, favIconUrl: string): string {
  if (hostname === 'github.com') {
    const dataPrefix = 'data:image/svg+xml;base64,';
    if (favIconUrl.startsWith(dataPrefix)) {
      const svgStr1 = atob(favIconUrl.slice(dataPrefix.length));
      const svgStr2 = svgStr1.replace(' fill="#24292E"', ' fill="#FFFFFF"');
      if (svgStr1 !== svgStr2) {
        return dataPrefix + btoa(svgStr2);
      }
    }
  }
  return favIconUrl;
}

function searchInput(): HTMLInputElement | null {
  return document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement | null;
}

const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export class App extends Component<{}, AppState> {
  private fetchedHostnames = new Set<string>();
  private debouncedSearch = debounce(
    (query: string) => this.doSearch(query),
    SEARCH_DEBOUNCE_MS
  );

  constructor(props: {}) {
    super(props);
    this.state = {
      config: { ...configDefaults },
      pinnedFolders: [],
      recentBookmarks: [],
      folderGroups: {},
      searchResults: null,
      favicons: {},
      editingBookmarkId: null,
      settingsOpen: false,
      pageLoaded: false,
    };
  }

  async componentDidMount() {
    const cfg = normalizeConfig(
      await browserAPI.storage.local.get(configDefaults)
    );
    updateConfig(cfg);

    const recent = await browserAPI.bookmarks.getRecent(
      cfg.recentBookmarksCount
    );
    if (!cfg.recentBookmarksReversed) recent.reverse();

    const stored = await browserAPI.storage.local.get({
      pinnedFolders: [] as string[],
    });
    const pf = stored.pinnedFolders;
    updatePinnedFolders(pf);

    let folderGroups: Record<string, FolderGroup> = {};
    if (pf.length > 0) {
      folderGroups = await this.loadFolderGroups(pf, cfg);
    }

    this.setState({
      config: cfg,
      pinnedFolders: pf,
      recentBookmarks: recent,
      folderGroups: folderGroups,
      pageLoaded: true,
    });

    browserAPI.bookmarks.onCreated.addListener(this.refreshAll);
    browserAPI.bookmarks.onRemoved.addListener(this.refreshAll);
    browserAPI.bookmarks.onMoved.addListener(this.refreshAll);
    browserAPI.storage.onChanged.addListener(this.onStorageChange);

    this.updateTheme();
    prefersDarkQuery.addEventListener('change', this.updateTheme);
  }

  componentDidUpdate() {
    if (!isChrome) {
      this.fetchFavicons();
    }
  }

  async loadFolderGroups(
    folderIds: string[],
    cfg: Config
  ): Promise<Record<string, FolderGroup>> {
    try {
      const folders = await browserAPI.bookmarks.get(folderIds);
      const groups: Record<string, FolderGroup> = {};
      await Promise.all(
        folders.map(async folder => {
          const children = await browserAPI.bookmarks.getChildren(folder.id);
          if (cfg.bookmarkFoldersReversed) children.reverse();
          groups[folder.id] = { title: folder.title, bookmarks: children };
        })
      );
      return groups;
    } catch (e) {
      return {};
    }
  }

  refreshAll = async () => {
    const cfg = this.state.config;
    const recent = await browserAPI.bookmarks.getRecent(
      cfg.recentBookmarksCount
    );
    if (!cfg.recentBookmarksReversed) recent.reverse();

    const stored = await browserAPI.storage.local.get({
      pinnedFolders: [] as string[],
    });
    const pf = stored.pinnedFolders;
    updatePinnedFolders(pf);

    let folderGroups: Record<string, FolderGroup> = {};
    if (pf.length > 0) {
      folderGroups = await this.loadFolderGroups(pf, cfg);
    }

    this.setState({
      pinnedFolders: pf,
      recentBookmarks: recent,
      folderGroups: folderGroups,
    });
  };

  onStorageChange = (changes: StorageChanges) => {
    if (changes.pinnedFolders) {
      this.refreshAll();
      return;
    }
    const configKeys = Object.keys(configDefaults) as (keyof Config)[];
    const changedKeys = configKeys.filter(key => key in changes);
    if (changedKeys.length === 0) return;
    const raw: Partial<Config> = { ...this.state.config };
    for (const key of changedKeys) {
      (raw as Record<string, unknown>)[key] = changes[key].newValue;
    }
    const cfg = normalizeConfig(raw);
    updateConfig(cfg);
    this.setState({ config: cfg }, () => this.refreshAll());
  };

  updateTheme = () => {
    if (!browserAPI.theme) return;
    browserAPI.theme.getCurrent().then(function () {
      const isDarkMode = prefersDarkQuery.matches;
      document.body.setAttribute('lwt-newtab', 'true');
      document.body.toggleAttribute('lwt-newtab-brighttext', isDarkMode);
    });
  };

  /**
   * Firefox only: look up cached favicons for every hostname on the page and
   * keep them in state so PlaceEntry can render them. Each hostname is only
   * fetched once per page load.
   */
  fetchFavicons() {
    const { recentBookmarks, folderGroups, searchResults } = this.state;
    const lists = [recentBookmarks, searchResults || []].concat(
      Object.values(folderGroups).map(g => g.bookmarks)
    );
    const keys: Record<string, string> = {};
    let hasNew = false;
    for (const list of lists) {
      for (const bookmark of list) {
        if (!bookmark.url) continue;
        let hostname: string;
        try {
          hostname = new URL(bookmark.url).hostname;
        } catch (e) {
          continue;
        }
        if (!this.fetchedHostnames.has(hostname)) {
          keys['favIconUrl-' + hostname] = '';
          this.fetchedHostnames.add(hostname);
          hasNew = true;
        }
      }
    }
    if (!hasNew) return;

    browserAPI.storage.local.get(keys).then(items => {
      const favicons = { ...this.state.favicons };
      for (const key of Object.keys(items)) {
        const hostname = key.slice('favIconUrl-'.length);
        const favIconUrl = items[key];
        if (!favIconUrl) continue;
        favicons[hostname] = prefersDarkQuery.matches
          ? fixDarkFavIcon(hostname, favIconUrl)
          : favIconUrl;
      }
      this.setState({ favicons: favicons });
    });
  }

  onQueryChange = () => {
    const query = searchInput()?.value ?? '';
    if (query) {
      this.debouncedSearch(query);
    } else {
      this.setState({ searchResults: null });
    }
  };

  doSearch(query: string) {
    browserAPI.bookmarks.search({ query: query }).then(results => {
      this.setState({ searchResults: results });
    });
  }

  openSettings = () => {
    this.setState({ settingsOpen: true });
  };

  closeSettings = () => {
    this.setState({ settingsOpen: false });
  };

  showEditBookmark = (bookmarkId: string) => {
    this.setState({ editingBookmarkId: bookmarkId });
  };

  closeEditBookmark = () => {
    this.setState({ editingBookmarkId: null });
    this.refreshAll();
  };

  togglePinnedFolder = (folderId: string) => {
    const pf = this.state.pinnedFolders;
    const wasPinned = pf.indexOf(folderId) >= 0;
    let newPf: string[];
    if (wasPinned) {
      newPf = pf.filter(id => id !== folderId);
    } else {
      newPf = pf.concat([folderId]);
      this.setState({ searchResults: null });
      const input = searchInput();
      if (input) input.value = '';
    }
    browserAPI.storage.local.set({ pinnedFolders: newPf });
  };

  movePinnedFolderByDelta = (folderId: string, delta: number) => {
    const pf = this.state.pinnedFolders;
    const index = pf.indexOf(folderId);
    if (index === -1) return;
    const newIndex = Math.max(0, Math.min(index + delta, pf.length - 1));
    if (newIndex === index) return;
    const newPf = pf.slice();
    newPf.splice(index, 1);
    newPf.splice(newIndex, 0, folderId);
    browserAPI.storage.local.set({ pinnedFolders: newPf });
  };

  render(_props: {}, state: AppState) {
    const {
      pinnedFolders,
      recentBookmarks,
      folderGroups,
      searchResults,
      favicons,
      editingBookmarkId,
      settingsOpen,
      pageLoaded,
    } = state;
    const groupProps = {
      pinnedFolders: pinnedFolders,
      favicons: favicons,
      onTogglePin: this.togglePinnedFolder,
      onEditBookmark: this.showEditBookmark,
    };

    return (
      <>
        <SearchBar
          onQueryChange={this.onQueryChange}
          onSettingsClick={this.openSettings}
        />
        <div class={styles.kanban + (pageLoaded ? '' : ' ' + styles.loading)}>
          {searchResults !== null ? (
            <KanbanGroup
              groupId="search"
              title="Search"
              bookmarks={searchResults}
              showFolders={true}
              {...groupProps}
            />
          ) : (
            <>
              <KanbanGroup
                groupId="recent"
                title="Recent"
                bookmarks={recentBookmarks}
                {...groupProps}
              />
              {pinnedFolders.map(folderId => {
                const group = folderGroups[folderId];
                if (!group) return null;
                return (
                  <KanbanGroup
                    key={folderId}
                    groupId={folderId}
                    title={group.title}
                    bookmarks={group.bookmarks}
                    editable={true}
                    onMoveLeft={() =>
                      this.movePinnedFolderByDelta(folderId, -1)
                    }
                    onMoveRight={() =>
                      this.movePinnedFolderByDelta(folderId, 1)
                    }
                    {...groupProps}
                  />
                );
              })}
            </>
          )}
        </div>
        {editingBookmarkId && (
          <EditBookmarkModal
            bookmarkId={editingBookmarkId}
            onClose={this.closeEditBookmark}
          />
        )}
        {settingsOpen && <SettingsModal onClose={this.closeSettings} />}
      </>
    );
  }
}
