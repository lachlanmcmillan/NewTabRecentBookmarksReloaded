// Unified browser API adapter.
// Wraps Chrome/Firefox extension APIs with:
// - Promise support (omit callback to get a Promise)
// - Backwards-compatible callback support (pass a callback, works as before)
// - Cross-browser helpers (bookmark type detection, favicon URLs)
//
// Load this script before any other extension scripts.

var isFirefox = typeof browser !== 'undefined'
var isChrome = !isFirefox

var browserAPI = (function() {
	var api = chrome

	// Wraps a callback-based Chrome API method so it also supports promises.
	// If the last argument is a function, it's used as a callback (existing behavior).
	// If no callback is passed, a Promise is returned instead.
	function wrapAsync(fn, context) {
		return function() {
			var args = Array.prototype.slice.call(arguments)
			var lastArg = args[args.length - 1]
			if (typeof lastArg === 'function') {
				return fn.apply(context, args)
			}
			return new Promise(function(resolve, reject) {
				args.push(function(result) {
					if (api.runtime.lastError) {
						reject(new Error(api.runtime.lastError.message))
					} else {
						resolve(result)
					}
				})
				fn.apply(context, args)
			})
		}
	}

	var adapter = {
		bookmarks: {
			get: wrapAsync(api.bookmarks.get, api.bookmarks),
			getChildren: wrapAsync(api.bookmarks.getChildren, api.bookmarks),
			getRecent: wrapAsync(api.bookmarks.getRecent, api.bookmarks),
			getTree: wrapAsync(api.bookmarks.getTree, api.bookmarks),
			search: wrapAsync(api.bookmarks.search, api.bookmarks),
			update: wrapAsync(api.bookmarks.update, api.bookmarks),
			move: wrapAsync(api.bookmarks.move, api.bookmarks),
			remove: wrapAsync(api.bookmarks.remove, api.bookmarks),
			onCreated: api.bookmarks.onCreated,
			onRemoved: api.bookmarks.onRemoved,
			onMoved: api.bookmarks.onMoved,
		},

		storage: {
			local: {
				get: wrapAsync(api.storage.local.get, api.storage.local),
				set: wrapAsync(api.storage.local.set, api.storage.local),
				remove: wrapAsync(api.storage.local.remove, api.storage.local),
			},
			onChanged: api.storage.onChanged,
		},

		runtime: {
			openOptionsPage: api.runtime.openOptionsPage.bind(api.runtime),
			getURL: api.runtime.getURL.bind(api.runtime),
		},
	}

	if (api.tabs) {
		adapter.tabs = {
			onUpdated: api.tabs.onUpdated,
		}
	}

	if (isFirefox && typeof browser.theme !== 'undefined') {
		adapter.theme = {
			getCurrent: browser.theme.getCurrent.bind(browser.theme),
		}
	}

	return adapter
})()

// Chrome does not set bookmark.type, Firefox does.
function detectBookmark(bookmark) {
	return (typeof bookmark.type !== 'undefined'
		? bookmark.type === 'bookmark'
		: typeof bookmark.dateGroupModified === 'undefined'
	)
}

function detectFolder(bookmark) {
	return (typeof bookmark.type !== 'undefined'
		? bookmark.type === 'folder'
		: typeof bookmark.dateGroupModified !== 'undefined'
	)
}

// Chrome uses a built-in favicon API. Firefox uses the favicon cacher background script.
function getFaviconURL(url) {
	if (!isChrome) {
		return null
	}
	var faviconUrl = new URL(browserAPI.runtime.getURL('/_favicon/'))
	faviconUrl.searchParams.set('pageUrl', url)
	faviconUrl.searchParams.set('size', '32')
	return faviconUrl.toString()
}
