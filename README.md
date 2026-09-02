# New Tab Recent Bookmarks Reloaded

A simple list of the most recent bookmarks, along with the ability to search for a bookmark folder and pin it. Pinned folders display their bookmarks in the descending chronological order as well.

- **Firefox:** https://addons.mozilla.org/en-CA/firefox/addon/new-tab-recent-bookmarks/

![](screenshots/FirefoxWithFavicons.png)
![](screenshots/ChromeSearchBookmarkPinFolder.png)
![](screenshots/ChromeEditBookmarkButton.png)
![](screenshots/ChromeEditBookmarkModal.png)
![](screenshots/ChromeSettings.png)

## Permissions

- **Chrome:** Favicons are displayed using the favicon cache.
- **Firefox:** Since firefox doesn't expose the favicon cache, the extension needs to do it manually. By using the `tabs` permission, it can store the favicons when you visit a site. Until you have visited a bookmark, the default globe icon is shown.

## Develop / Build

Install dependencies with `npm install`, then:

- `npm run build:firefox` builds the extension into `dist/` and packages it as `dist/new-tab-recent-bookmarks-<version>.xpi`.
- `npm run build:chrome` builds the extension into `dist/` with a Chrome manifest.
- `npm run watch` rebuilds `dist/` on every change.
- `npm run typecheck` runs the TypeScript compiler without emitting. The build scripts run it first.

For development, load `dist/manifest.json` as a temporary add-on from `about:debugging#/runtime/this-firefox`, or load `dist/` as an unpacked extension in Chrome.

![](screenshots/ChromeWithFavicons.png)

## Credits

Forked from https://github.com/zren/NewTabRecentBookmarks.
