// Background script (Firefox only). Firefox does not expose its favicon
// cache to extensions, so this records each site's favicon URL the first
// time a tab for that host reports one. The new tab page reads the
// `favIconUrl-<hostname>` keys back out of storage.
import { browserAPI, isFirefox } from './browser-adapter';

async function cacheFavicon(hostname: string, favIconUrl: string) {
  const items = await browserAPI.storage.local.get({
    favIconHostList: [] as string[],
  });
  if (items.favIconHostList.indexOf(hostname) !== -1) return;

  const hostnameKey = 'favIconUrl-' + hostname;
  console.log('cacheFavicon', hostnameKey, favIconUrl);
  await browserAPI.storage.local.set({
    favIconHostList: [...items.favIconHostList, hostname],
    [hostnameKey]: favIconUrl,
  });
}

function onTabUpdated(
  _tabId: number,
  changeInfo: { favIconUrl?: string },
  tab: { url?: string }
) {
  if (!changeInfo.favIconUrl || !tab.url) return;
  let hostname: string;
  try {
    hostname = new URL(tab.url).hostname;
  } catch (e) {
    return;
  }
  cacheFavicon(hostname, changeInfo.favIconUrl);
}

if (isFirefox) {
  browser.tabs.onUpdated.addListener(onTabUpdated, {
    properties: ['favIconUrl'],
  });
}
