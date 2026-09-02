import { render, Component } from 'preact';
import { browserAPI, isChrome } from './browser-adapter.js';
import { configDefaults } from './config.js';
import { updateConfig, updatePinnedFolders } from './state.js';
import { KanbanGroup } from './KanbanGroup.jsx';
import { EditBookmarkModal } from './EditBookmarkModal.jsx';
import { SettingsModal } from './SettingsModal.jsx';

function debounce(func, wait) {
  var timeout;
  return function () {
    var context = this;
    var args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      func.apply(context, args);
    }, wait);
  };
}

function fixDarkFavIcon(hostname, favIconUrl) {
  if (hostname === 'github.com') {
    var dataPrefix = 'data:image/svg+xml;base64,';
    if (favIconUrl.startsWith(dataPrefix)) {
      var svgStr1 = atob(favIconUrl.substr(dataPrefix.length));
      var svgStr2 = svgStr1.replace(' fill="#24292E"', ' fill="#FFFFFF"');
      if (svgStr1 !== svgStr2) {
        return dataPrefix + btoa(svgStr2);
      }
    }
  }
  return favIconUrl;
}

var prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

class SearchBar extends Component {
  render({ onQueryChange, onSettingsClick }) {
    return (
      <div class="search-wrapper">
        <div class="search-padder"></div>
        <div class="search-inner-wrapper">
          <input
            id="newtab-search-text"
            maxlength="256"
            type="search"
            autocomplete="off"
            aria-label="Search the Web"
            title="Search Bookmarks"
            placeholder="Search Bookmarks"
            onInput={onQueryChange}
            onSearch={onQueryChange}
          />
          <svg
            id="search-bookmark-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
          >
            <path
              fill="context-fill"
              fill-opacity="context-fill-opacity"
              d="M15.845 6.064A1.1 1.1 0 0 0 15 5.331L10.911 4.6 8.985.735a1.1 1.1 0 0 0-1.969 0L5.089 4.6l-4.081.729a1.1 1.1 0 0 0-.615 1.834L3.32 10.31l-.609 4.36a1.1 1.1 0 0 0 1.6 1.127L8 13.873l3.69 1.927a1.1 1.1 0 0 0 1.6-1.127l-.61-4.363 2.926-3.146a1.1 1.1 0 0 0 .239-1.1z"
            />
          </svg>
          <button
            id="searchSubmit"
            class="search-button"
            title="Search"
            aria-label="Search"
            onClick={onQueryChange}
          ></button>
        </div>
        <button id="open-options-page" onClick={onSettingsClick}></button>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: { ...configDefaults },
      pinnedFolders: [],
      recentBookmarks: [],
      folderGroups: {},
      searchResults: null,
      editingBookmarkId: null,
      settingsOpen: false,
      pageLoaded: false,
    };
    this._fetchedHostnames = new Set();
    this.debouncedSearch = debounce(this.doSearch.bind(this), 600);
  }

  async componentDidMount() {
    var cfg = await browserAPI.storage.local.get(configDefaults);
    updateConfig(cfg);

    var recent = await browserAPI.bookmarks.getRecent(36);
    if (!cfg.recentBookmarksReversed) recent.reverse();

    var stored = await browserAPI.storage.local.get({ pinnedFolders: [] });
    var pf = stored.pinnedFolders;
    updatePinnedFolders(pf);

    var folderGroups = {};
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

  async loadFolderGroups(folderIds, cfg) {
    cfg = cfg || this.state.config;
    try {
      var folders = await browserAPI.bookmarks.get(folderIds);
      var groups = {};
      await Promise.all(
        folders.map(async folder => {
          var children = await browserAPI.bookmarks.getChildren(folder.id);
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
    var cfg = this.state.config;
    var recent = await browserAPI.bookmarks.getRecent(36);
    if (!cfg.recentBookmarksReversed) recent.reverse();

    var stored = await browserAPI.storage.local.get({ pinnedFolders: [] });
    var pf = stored.pinnedFolders;
    updatePinnedFolders(pf);

    var folderGroups = {};
    if (pf.length > 0) {
      folderGroups = await this.loadFolderGroups(pf, cfg);
    }

    this.setState({
      pinnedFolders: pf,
      recentBookmarks: recent,
      folderGroups: folderGroups,
    });
  };

  onStorageChange = changes => {
    if (changes.pinnedFolders) {
      this.refreshAll();
    } else if (changes.recentBookmarksReversed) {
      var cfg = {
        ...this.state.config,
        recentBookmarksReversed: changes.recentBookmarksReversed.newValue,
      };
      updateConfig(cfg);
      this.setState({ config: cfg }, () => this.refreshAll());
    } else if (changes.bookmarkFoldersReversed) {
      var cfg = {
        ...this.state.config,
        bookmarkFoldersReversed: changes.bookmarkFoldersReversed.newValue,
      };
      updateConfig(cfg);
      this.setState({ config: cfg }, () => this.refreshAll());
    }
  };

  updateTheme = () => {
    if (!browserAPI.theme) return;
    browserAPI.theme.getCurrent().then(function () {
      var isDarkMode = prefersDarkQuery.matches;
      document.body.setAttribute('lwt-newtab', 'true');
      document.body.toggleAttribute('lwt-newtab-brighttext', isDarkMode);
    });
  };

  fetchFavicons() {
    var icons = document.querySelectorAll('.place-icon[data-hostname]');
    var keys = {};
    var hasNew = false;
    for (var i = 0; i < icons.length; i++) {
      var hostname = icons[i].getAttribute('data-hostname');
      if (!this._fetchedHostnames.has(hostname)) {
        keys['favIconUrl-' + hostname] = '';
        this._fetchedHostnames.add(hostname);
        hasNew = true;
      }
    }
    if (!hasNew) return;

    browserAPI.storage.local.get(keys).then(function (items) {
      var style = document.querySelector('style#favicon-style');
      if (!style) {
        style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.setAttribute('id', 'favicon-style');
        document.head.appendChild(style);
      }
      var stylesheet = style.sheet;
      for (var key of Object.keys(items)) {
        var h = key.substr('favIconUrl-'.length);
        var favIconUrl = items[key];
        if (favIconUrl) {
          if (prefersDarkQuery.matches) {
            favIconUrl = fixDarkFavIcon(h, favIconUrl);
          }
          var selector = '.place-icon[data-hostname="' + h + '"]';
          var rule =
            selector +
            ' { background-image: url(' +
            favIconUrl +
            '); background-color: transparent !important; }';
          stylesheet.insertRule(rule, stylesheet.cssRules.length);
        }
      }
    });
  }

  onQueryChange = () => {
    var query = document.querySelector('#newtab-search-text').value;
    if (query) {
      this.debouncedSearch(query);
    } else {
      this.setState({ searchResults: null });
    }
  };

  doSearch(query) {
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

  showEditBookmark = bookmarkId => {
    this.setState({ editingBookmarkId: bookmarkId });
  };

  closeEditBookmark = () => {
    this.setState({ editingBookmarkId: null });
    this.refreshAll();
  };

  togglePinnedFolder = folderId => {
    var pf = this.state.pinnedFolders;
    var wasPinned = pf.indexOf(folderId) >= 0;
    var newPf;
    if (wasPinned) {
      newPf = pf.filter(id => id !== folderId);
    } else {
      newPf = pf.concat([folderId]);
      this.setState({ searchResults: null });
      var input = document.querySelector('#newtab-search-text');
      if (input) input.value = '';
    }
    browserAPI.storage.local.set({ pinnedFolders: newPf });
  };

  movePinnedFolderByDelta = (folderId, delta) => {
    var pf = this.state.pinnedFolders;
    var index = pf.indexOf(folderId);
    if (index === -1) return;
    var newIndex = Math.max(0, Math.min(index + delta, pf.length - 1));
    if (newIndex === index) return;
    var newPf = pf.slice();
    newPf.splice(index, 1);
    newPf.splice(newIndex, 0, folderId);
    browserAPI.storage.local.set({ pinnedFolders: newPf });
  };

  render(props, state) {
    var {
      config,
      pinnedFolders,
      recentBookmarks,
      folderGroups,
      searchResults,
      editingBookmarkId,
      settingsOpen,
      pageLoaded,
    } = state;
    var searching = searchResults !== null;

    return (
      <>
        <SearchBar
          onQueryChange={this.onQueryChange}
          onSettingsClick={this.openSettings}
        />
        <div
          id="kanban"
          class={searching ? 'searching' : ''}
          {...(!pageLoaded ? { loading: 'true' } : {})}
        >
          <KanbanGroup
            groupId="search"
            title="Search"
            bookmarks={searchResults || []}
            config={config}
            pinnedFolders={pinnedFolders}
            onTogglePin={this.togglePinnedFolder}
            onEditBookmark={this.showEditBookmark}
          />
          <KanbanGroup
            groupId="recent"
            title="Recent"
            bookmarks={recentBookmarks}
            config={config}
            pinnedFolders={pinnedFolders}
            onTogglePin={this.togglePinnedFolder}
            onEditBookmark={this.showEditBookmark}
          />
          {pinnedFolders.map(folderId => {
            var group = folderGroups[folderId];
            if (!group) return null;
            return (
              <KanbanGroup
                key={folderId}
                groupId={folderId}
                title={group.title}
                bookmarks={group.bookmarks}
                config={config}
                pinnedFolders={pinnedFolders}
                editable={true}
                onTogglePin={this.togglePinnedFolder}
                onMoveLeft={() => this.movePinnedFolderByDelta(folderId, -1)}
                onMoveRight={() => this.movePinnedFolderByDelta(folderId, 1)}
                onEditBookmark={this.showEditBookmark}
              />
            );
          })}
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

render(<App />, document.getElementById('app'));
